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

  // --- Snipping Mode ---
  var snippingEl = null;
  var snippingStartX = 0;
  var snippingStartY = 0;
  var snippingDragRect = null;
  var snippingRectEl = null;
  var snippingCallback = null;

  function startSnipping(callback) {
    snippingCallback = callback;
    removeOverlay();

    snippingEl = document.createElement("div");
    snippingEl.style.cssText =
      "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483646;" +
      "background:rgba(0,0,0,0.25);cursor:crosshair;";
    document.body.appendChild(snippingEl);

    var hint = document.createElement("div");
    hint.style.cssText =
      "position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:2147483647;" +
      "padding:4px 12px;border-radius:4px;background:rgba(0,0,0,0.7);color:#fff;" +
      "font-size:11px;font-family:-apple-system,sans-serif;" +
      "pointer-events:none;white-space:nowrap;";
    hint.textContent = "Bereich auswählen  |  Enter = ganze Seite  |  Esc = abbrechen";
    snippingEl.appendChild(hint);

    snippingRectEl = document.createElement("div");
    snippingRectEl.style.cssText =
      "position:fixed;z-index:2147483647;pointer-events:none;" +
      "border:2px dashed rgba(124,131,255,0.8);background:rgba(124,131,255,0.08);display:none;";
    document.body.appendChild(snippingRectEl);

    snippingEl.addEventListener("mousedown", function (e) {
      snippingStartX = e.clientX;
      snippingStartY = e.clientY;
      snippingDragRect = null;
      snippingRectEl.style.display = "block";
      snippingRectEl.style.left = e.clientX + "px";
      snippingRectEl.style.top = e.clientY + "px";
      snippingRectEl.style.width = "0px";
      snippingRectEl.style.height = "0px";

      function onMove(ev) {
        var x = Math.min(snippingStartX, ev.clientX);
        var y = Math.min(snippingStartY, ev.clientY);
        var w = Math.abs(ev.clientX - snippingStartX);
        var h = Math.abs(ev.clientY - snippingStartY);
        snippingRectEl.style.left = x + "px";
        snippingRectEl.style.top = y + "px";
        snippingRectEl.style.width = w + "px";
        snippingRectEl.style.height = h + "px";
        snippingDragRect = { x: x, y: y, width: w, height: h };
      }

      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        if (snippingDragRect && snippingDragRect.width > 10 && snippingDragRect.height > 10) {
          finishSnipping(snippingDragRect);
        }
        // If tiny or no selection, overlay stays – user can try again or press Esc/Enter
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });

    function onKey(e) {
      if (e.key === "Escape") {
        document.removeEventListener("keydown", onKey);
        cleanSnipping();
      } else if (e.key === "Enter") {
        document.removeEventListener("keydown", onKey);
        finishSnipping("full");
      }
    }
    document.addEventListener("keydown", onKey);
  }

  function cleanSnipping() {
    var el = snippingEl;
    var rEl = snippingRectEl;
    snippingEl = null;
    snippingRectEl = null;
    snippingDragRect = null;
    if (el) el.remove();
    if (rEl) rEl.remove();
  }

  function finishSnipping(result) {
    cleanSnipping();
    if (snippingCallback) {
      snippingCallback(result);
      snippingCallback = null;
    }
  }

  function cropImageToBase64(dataUrl, rect) {
    try {
      var img = new Image();
      return new Promise(function (resolve, reject) {
        img.onload = function () {
          try {
            var dpr = window.devicePixelRatio || 1;
            var sx = Math.round(rect.x * dpr);
            var sy = Math.round(rect.y * dpr);
            var sw = Math.round(rect.width * dpr);
            var sh = Math.round(rect.height * dpr);
            // Clamp to image bounds
            if (sx < 0) sx = 0;
            if (sy < 0) sy = 0;
            if (sx + sw > img.width) sw = img.width - sx;
            if (sy + sh > img.height) sh = img.height - sy;
            if (sw <= 0 || sh <= 0) { resolve(dataUrl); return; }

            var canvas = document.createElement("canvas");
            canvas.width = sw;
            canvas.height = sh;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          } catch (e) {
            resolve(dataUrl);
          }
        };
        img.onerror = function () { resolve(dataUrl); };
        img.src = dataUrl;
      });
    } catch (e) {
      return Promise.resolve(dataUrl);
    }
  }

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
    } else if (message.type === "snipping-start") {
      startSnipping(function (result) {
        if (result === "full") {
          chrome.runtime.sendMessage({ type: "snipping-area", fullPage: true });
        } else if (result) {
          chrome.runtime.sendMessage({
            type: "snipping-area",
            rect: result,
          });
        }
      });
    } else if (message.type === "crop-and-return") {
      if (message.rect) {
        cropImageToBase64(message.dataUrl, message.rect).then(function (cropped) {
          chrome.runtime.sendMessage({
            type: "snipping-result",
            dataUrl: cropped,
          });
        });
      } else {
        chrome.runtime.sendMessage({
          type: "snipping-result",
          dataUrl: message.dataUrl,
        });
      }
    }
  });

  function rgba(hexColor, alpha) {
    if (/^rgb/.test(hexColor)) {
      return hexColor.replace("rgb(", "rgba(").replace(")", ", " + alpha + ")");
    }
    return "rgba(0,0,0," + alpha + ")";
  }
})();
