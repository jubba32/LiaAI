(function () {
  "use strict";

  var overlayEl = null;
  var dismissTimer = null;
  var injectedStyles = [];
  var displayMode = "normal";
  var autoDismissSec = 6;
  var noLoadingIndicator = false;
  var lastMouseX = 0;
  var lastMouseY = 0;

  function loadSettings() {
    chrome.storage.sync.get(
      ["displayMode", "autoDismiss", "noLoadingIndicator"],
      function (r) {
        if (r.displayMode) displayMode = r.displayMode;
        if (r.autoDismiss) autoDismissSec = r.autoDismiss;
        noLoadingIndicator = !!r.noLoadingIndicator;
      }
    );
  }
  loadSettings();
  chrome.storage.onChanged.addListener(function (changes) {
    if (changes.displayMode) displayMode = changes.displayMode.newValue;
    if (changes.autoDismiss) autoDismissSec = changes.autoDismiss.newValue;
    if (changes.noLoadingIndicator) noLoadingIndicator = !!changes.noLoadingIndicator.newValue;
  });

  document.addEventListener("mousemove", function (e) {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  function injectStyle(cssText) {
    var s = document.createElement("style");
    s.textContent = cssText;
    (document.head || document.documentElement).appendChild(s);
    injectedStyles.push(s);
  }

  function removeOverlay() {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
    if (dismissTimer) {
      clearTimeout(dismissTimer);
      dismissTimer = null;
    }
    for (var i = 0; i < injectedStyles.length; i++) {
      injectedStyles[i].remove();
    }
    injectedStyles = [];
  }

  function showNormal(content) {
    removeOverlay();
    overlayEl = document.createElement("div");
    overlayEl.id = "liaai-overlay";
    overlayEl.innerHTML =
      '<div class="liaai-card">' +
      '<button class="liaai-close">&times;</button>' +
      '<div class="liaai-content">' +
      content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>") +
      "</div>" +
      "</div>";
    document.body.appendChild(overlayEl);
    overlayEl.querySelector(".liaai-close").addEventListener("click", removeOverlay);
    dismissTimer = setTimeout(removeOverlay, autoDismissSec * 1000);
  }

  function showStealth(content) {
    removeOverlay();

    overlayEl = document.createElement("div");
    overlayEl.id = "liaai-stealth";

    var pageStyle = getComputedStyle(document.body);
    var textColor = pageStyle.color || "#333";

    overlayEl.style.cssText =
      "position:fixed;z-index:2147483647;bottom:8px;left:50%;transform:translateX(-50%);" +
      "max-width:360px;padding:4px 10px;border-radius:4px;" +
      "font-family:inherit;font-size:10px;color:" + textColor + ";" +
      "line-height:1.35;background:" + rgba(textColor, 0.04) + ";" +
      "border:1px solid " + rgba(textColor, 0.06) + ";" +
      "backdrop-filter:blur(1px);-webkit-backdrop-filter:blur(1px);" +
      "white-space:pre-line;cursor:default;opacity:0.82;" +
      "animation:liaai-quickfade 0.2s ease-out;" +
      "box-shadow:none;text-align:center;";

    overlayEl.textContent = content;

    injectStyle("@keyframes liaai-quickfade{from{opacity:0}to{opacity:0.82}}");
    document.body.appendChild(overlayEl);

    dismissTimer = setTimeout(removeOverlay, autoDismissSec * 1000);
  }

  function showClipboard(content) {
    removeOverlay();

    navigator.clipboard.writeText(content).then(function () {
      showCopyConfirm();
    }).catch(function () {
      var ta = document.createElement("textarea");
      ta.value = content;
      ta.style.cssText = "position:fixed;left:-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      showCopyConfirm();
    });
  }

  function showCopyConfirm() {
    removeOverlay();

    overlayEl = document.createElement("div");
    overlayEl.id = "liaai-stealth";
    overlayEl.style.cssText =
      "position:fixed;bottom:20px;right:20px;z-index:2147483647;" +
      "padding:4px 10px;border-radius:4px;" +
      "background:rgba(0,0,0,0.7);color:#fff;font-size:11px;" +
      "font-family:-apple-system,sans-serif;";

    injectStyle("@keyframes liaai-quickfade{from{opacity:0}to{opacity:1}}");
    overlayEl.style.animation = "liaai-quickfade 0.15s ease-out";
    overlayEl.textContent = "\u2713 Kopiert";
    document.body.appendChild(overlayEl);
    dismissTimer = setTimeout(removeOverlay, 1500);
  }

  function showLoading() {
    removeOverlay();
    if (displayMode === "clipboard") return;
    if (displayMode === "stealth" && noLoadingIndicator) return;

    overlayEl = document.createElement("div");
    overlayEl.id = "liaai-overlay";

    if (displayMode === "stealth") {
      overlayEl.style.cssText =
        "position:fixed;z-index:2147483647;bottom:8px;left:50%;margin-left:-6px;" +
        "width:12px;height:12px;border:2px solid rgba(0,0,0,0.08);border-top-color:rgba(0,0,0,0.2);" +
        "border-radius:50%;";
      injectStyle("@keyframes liaai-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}");
      overlayEl.style.animation = "liaai-spin 0.7s linear infinite";
    } else {
      overlayEl.innerHTML =
        '<div class="liaai-card liaai-loading">' +
        '<div class="liaai-spinner"></div>' +
        "</div>";
    }

    document.body.appendChild(overlayEl);
  }

  function showAnswer(text) {
    if (displayMode === "stealth") {
      showStealth(text);
    } else if (displayMode === "clipboard") {
      showClipboard(text);
    } else {
      showNormal(text);
    }
  }

  function showError(text) {
    removeOverlay();
    overlayEl = document.createElement("div");
    overlayEl.id = "liaai-overlay";
    overlayEl.innerHTML =
      '<div class="liaai-card liaai-error">' +
      '<button class="liaai-close">&times;</button>' +
      '<div class="liaai-content">' +
      text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
      "</div>" +
      "</div>";
    document.body.appendChild(overlayEl);
    overlayEl.querySelector(".liaai-close").addEventListener("click", removeOverlay);
    dismissTimer = setTimeout(removeOverlay, 8000);
  }

  function extractPageText() {
    try {
      var vh = window.innerHeight;
      var vw = window.innerWidth;
      var skipTags = {
        script: 1, style: 1, noscript: 1, svg: 1, iframe: 1,
        nav: 1, footer: 1, header: 1,
      };
      var seen = {};
      var lines = [];

      var walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            var parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (skipTags[parent.tagName.toLowerCase()]) return NodeFilter.FILTER_REJECT;

            var rect = parent.getBoundingClientRect();
            if (
              rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw ||
              rect.width === 0 || rect.height === 0
            ) {
              return NodeFilter.FILTER_REJECT;
            }

            var txt = (node.textContent || "").trim();
            if (!txt || txt.length < 2) return NodeFilter.FILTER_REJECT;

            var key = txt.substring(0, 60);
            if (seen[key]) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      while (walker.nextNode()) {
        var t = walker.currentNode.textContent.trim();
        if (t) {
          seen[t.substring(0, 60)] = true;
          lines.push(t);
        }
      }

      var text = lines.join("\n");
      text = text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
      if (text.length > 8000) text = text.substring(0, 8000);
      return text;
    } catch (err) {
      return "";
    }
  }

  function getSelectionText() {
    var sel = window.getSelection();
    return sel ? sel.toString().trim() : "";
  }

  function triggerAnalysis(contextText) {
    chrome.runtime.sendMessage({
      type: "trigger-analysis",
      context: contextText || "",
    });
  }

  // --- Esc dismiss ---
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlayEl) {
      removeOverlay();
    }
  });

  // --- Ctrl+C -> Auto-Analyse ---
  document.addEventListener("copy", function () {
    var selText = getSelectionText();
    if (selText && selText.length >= 3) {
      triggerAnalysis(selText);
    }
  });

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === "ping") {
      sendResponse({ ok: true });
    } else if (message.type === "loading") {
      showLoading();
    } else if (message.type === "answer") {
      showAnswer(message.text);
    } else if (message.type === "error") {
      showError(message.text);
    } else if (message.type === "extract-text") {
      sendResponse({ text: extractPageText() });
    } else if (message.type === "get-selection") {
      sendResponse({ text: getSelectionText() });
    }
  });

  function rgba(hexColor, alpha) {
    if (/^rgb/.test(hexColor)) {
      return hexColor.replace("rgb(", "rgba(").replace(")", ", " + alpha + ")");
    }
    return "rgba(0,0,0," + alpha + ")";
  }
})();
