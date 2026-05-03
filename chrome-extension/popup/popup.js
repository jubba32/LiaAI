document.addEventListener("DOMContentLoaded", function () {
  var geminiKeyInput = document.getElementById("geminiKey");
  var modelSelect = document.getElementById("model");
  var displayModeSelect = document.getElementById("displayMode");
  var autoDismissSelect = document.getElementById("autoDismiss");
  var noLoadingCheckbox = document.getElementById("noLoadingIndicator");
  var customPromptTextarea = document.getElementById("customPrompt");
  var stealthOptions = document.getElementById("stealthOptions");
  var saveBtn = document.getElementById("saveBtn");
  var statusEl = document.getElementById("status");
  var toggleGeminiKeyBtn = document.getElementById("toggleGeminiKey");
  var historySection = document.getElementById("historySection");
  var historyList = document.getElementById("historyList");

  chrome.storage.sync.get(
    ["geminiKey", "model", "displayMode", "autoDismiss", "customPrompt", "noLoadingIndicator"],
    function (result) {
      if (result.geminiKey) geminiKeyInput.value = result.geminiKey;
      if (result.model) modelSelect.value = result.model;
      if (result.displayMode) displayModeSelect.value = result.displayMode;
      if (result.autoDismiss) autoDismissSelect.value = result.autoDismiss;
      if (result.customPrompt) customPromptTextarea.value = result.customPrompt;
      if (result.noLoadingIndicator) noLoadingCheckbox.checked = true;
      updateStealthVisibility();
    }
  );

  displayModeSelect.addEventListener("change", updateStealthVisibility);

  function updateStealthVisibility() {
    stealthOptions.style.display =
      displayModeSelect.value === "stealth" ? "block" : "none";
  }

  toggleGeminiKeyBtn.addEventListener("click", function () {
    geminiKeyInput.type = geminiKeyInput.type === "password" ? "text" : "password";
  });

  function loadShortcuts() {
    chrome.commands.getAll(function (commands) {
      var byName = {};
      commands.forEach(function (c) { byName[c.name] = c.shortcut || "nicht belegt"; });
      var elS = document.getElementById("shortcutAnalyzeScreenshot");
      var elK = document.getElementById("shortcutAnalyzeSelection");
      if (elS) elS.textContent = byName["analyze-screenshot"] || "";
      if (elK) elK.textContent = byName["analyze-selection"] || "";
    });
  }
  loadShortcuts();

  var openLink = document.getElementById("openShortcuts");
  if (openLink) {
    openLink.addEventListener("click", function (e) {
      e.preventDefault();
      chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
    });
  }

  saveBtn.addEventListener("click", function () {
    var geminiKey = geminiKeyInput.value.trim();
    var model = modelSelect.value;
    var displayMode = displayModeSelect.value;
    var autoDismiss = parseInt(autoDismissSelect.value, 10);
    var customPrompt = customPromptTextarea.value.trim();
    var noLoadingIndicator = noLoadingCheckbox.checked;

    if (!geminiKey) {
      setStatus("Bitte Gemini API Key eingeben", "error");
      return;
    }

    chrome.storage.sync.set(
      { geminiKey, model, displayMode, autoDismiss, customPrompt, noLoadingIndicator },
      function () {
        setStatus("Gespeichert!", "success");
        setTimeout(function () { setStatus(""); }, 2000);
      }
    );
  });

  function setStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = "status " + type;
  }

  function loadHistory() {
    chrome.storage.local.get(["history"], function (r) {
      var h = r.history || [];
      if (h.length === 0) return;
      historySection.style.display = "block";
      historyList.innerHTML = "";
      h.forEach(function (entry) {
        var time = new Date(entry.time);
        var timeStr = time.getHours() + ":" +
          String(time.getMinutes()).padStart(2, "0");
        var item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML =
          '<span class="history-time">' + timeStr + "</span>" +
          '<span class="history-text">' +
          entry.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
          "</span>";
        historyList.appendChild(item);
      });
    });
  }

  loadHistory();
});
