var GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/";
var API_TIMEOUT = 15000;

var DEFAULT_SYSTEM_PROMPT =
  "Du beantwortest Multiple-Choice-Fragen. Beginne mit der Optionsnummer, dann die Antwort.\n\n" +
  "Beispiel – Text: '1. Paris  2. London  3. Berlin – Was ist die Hauptstadt von Frankreich?'\n" +
  "Deine Antwort: '1 – Paris ist die Hauptstadt von Frankreich.'\n\n" +
  "Kein Markdown, keine Erklärungen, keine Zusatztexte.";

function setBadge(text, color) {
  chrome.action.setBadgeText({ text: text });
  if (color) chrome.action.setBadgeBackgroundColor({ color: color });
}

async function updateBadge() {
  var d = await chrome.storage.sync.get("geminiKey");
  setBadge(d.geminiKey ? "" : "!", d.geminiKey ? "" : "#f87171");
}

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "ping" });
    return true;
  } catch (_) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content.js"],
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ["content.css"],
      });
      await new Promise(function (r) { setTimeout(r, 150); });
      return true;
    } catch (err) {
      console.error("LiaAI: Cannot inject:", err.message);
      return false;
    }
  }
}

function saveHistory(text) {
  chrome.storage.local.get(["history"], function (r) {
    var h = r.history || [];
    h.unshift({ text: text, time: Date.now() });
    if (h.length > 3) h.length = 3;
    chrome.storage.local.set({ history: h });
  });
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get(
    [
      "geminiKey", "model", "displayMode", "autoDismiss",
      "customPrompt", "noLoadingIndicator",
    ],
    function (result) {
      if (!result.model)
        chrome.storage.sync.set({ model: "gemini-2.5-flash" });
      if (!result.displayMode)
        chrome.storage.sync.set({ displayMode: "normal" });
      if (!result.autoDismiss)
        chrome.storage.sync.set({ autoDismiss: 6 });
      if (!result.customPrompt)
        chrome.storage.sync.set({ customPrompt: "" });
      if (!result.noLoadingIndicator)
        chrome.storage.sync.set({ noLoadingIndicator: false });
      if (!result.geminiKey)
        chrome.storage.sync.set({ geminiKey: "" });
    }
  );
  updateBadge();
});

chrome.runtime.onStartup.addListener(updateBadge);
chrome.storage.onChanged.addListener(function (changes) {
  if (changes.geminiKey) updateBadge();
});

chrome.commands.onCommand.addListener(async function (command) {
  var tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  var tab = tabs[0];
  if (!tab || !tab.id) return;
  if (!(await ensureContentScript(tab.id))) return;

  if (command === "analyze-selection") {
    var resp = await chrome.tabs.sendMessage(tab.id, {
      type: "get-selection",
    });
    var selText = resp?.text || "";
    if (selText.length < 3) {
      await chrome.tabs.sendMessage(tab.id, {
        type: "error",
        text: "Kein Text ausgewählt. Bitte Text markieren.",
      });
      return;
    }
    await analyze(tab.id, selText);
    return;
  }

  if (command === "analyze-screenshot") {
    await analyze(tab.id, "");
    return;
  }
});

chrome.runtime.onMessage.addListener(function (message, sender) {
  if (message.type === "trigger-analysis" && sender.tab?.id) {
    analyze(sender.tab.id, message.context || "");
  }
});

async function analyze(tabId, contextText) {
  try {
    var settings = await chrome.storage.sync.get([
      "geminiKey", "model", "customPrompt",
    ]);

    var geminiKey = (settings.geminiKey || "").trim();
    if (!geminiKey) { chrome.action.openPopup(); return; }

    setBadge("...", "#fbbf24");
    await chrome.tabs.sendMessage(tabId, { type: "loading" });

    var model = settings.model || "gemini-2.5-flash";
    var systemPrompt =
      (settings.customPrompt || "").trim() || DEFAULT_SYSTEM_PROMPT;

    var answer;

    if (contextText) {
      answer = await callGeminiText(contextText, geminiKey, model, systemPrompt);
    } else {
      var screenshot = await chrome.tabs.captureVisibleTab(null, {
        format: "jpeg",
        quality: 80,
      });
      var base64 = screenshot.split(",")[1];
      answer = await callGeminiVision(base64, geminiKey, model, systemPrompt);
    }

    setBadge("", "");
    saveHistory(answer);
    await chrome.tabs.sendMessage(tabId, { type: "answer", text: answer });
  } catch (error) {
    console.error("LiaAI error:", error);
    setBadge("!", "#f87171");
    setTimeout(function () { updateBadge(); }, 3000);
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "error",
        text: error.message || "Fehler",
      });
    } catch (_) {}
  }
}

async function callGeminiText(text, apiKey, model, systemPrompt) {
  return await callGemini(
    [{ text: systemPrompt + "\n\n" + text }],
    apiKey,
    model
  );
}

async function callGeminiVision(base64Image, apiKey, model, systemPrompt) {
  return await callGemini(
    [
      { text: systemPrompt },
      { inline_data: { mime_type: "image/jpeg", data: base64Image } },
    ],
    apiKey,
    model
  );
}

async function callGemini(parts, apiKey, model) {
  var url = GEMINI_BASE + model + ":generateContent?key=" + apiKey;

  var resp = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: parts }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.3,
        },
      }),
    },
    API_TIMEOUT
  );

  if (!resp.ok) {
    var errText = await resp.text();
    var msg;
    try {
      msg = JSON.parse(errText).error?.message || "HTTP " + resp.status;
    } catch (_) {
      msg = "HTTP " + resp.status + ": " + errText.substring(0, 200);
    }
    throw new Error("Gemini: " + msg);
  }

  var data = await resp.json();
  var text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: Keine Antwort erhalten");
  return text;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, timeoutMs);
  try {
    return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }
}
