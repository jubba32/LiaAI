# LiaAI

> **Screenshot-Analyse per Knopfdruck – unsichtbare KI-Antworten für Prüfungen & Tests**

LiaAI ist eine Chrome Extension, die den sichtbaren Seiteninhalt per Screenshot erfasst, an **Google Gemini** sendet und die Antwort direkt auf der Seite anzeigt – dezent, schnell und mit maximaler Tarnung.

---

## Features

| Feature | Beschreibung |
|---|---|---|
| **Screenshot-Analyse** | `Cmd+Shift+Y` fotografiert die sichtbare Seite, Gemini antwortet direkt |
| **Auswahl-Analyse** | `Cmd+Shift+K` analysiert nur markierten Text |
| **Stealth-Mode** | Mini-Text zentriert unten, kaum sichtbar, passt sich der Seiten-Schrift an |
| **Clipboard-Mode** | Antwort landet direkt in der Zwischenablage, kein Overlay |
| **Ctrl+C Trigger** | Kopieren = automatische Analyse |
| **Esc-Dismiss** | Overlay sofort per Escape-Taste schließen |
| **Auto-Dismiss** | Konfigurierbare Selbstzerstörung (3–20 Sekunden) |
| **History** | Letzte 3 Antworten im Popup einsehbar |
| **Eigener Prompt** | System-Prompt anpassbar (Leer = Few-Shot-Default) |

---

## Installation

### 1. Chrome Extension laden
1. **Download** dieses Repository (Code → Download ZIP)
2. Entpacke den Ordner
3. Chrome öffnen → `chrome://extensions`
4. **Entwicklermodus** (oben rechts) aktivieren
5. **Entpackte Erweiterung laden** → Ordner `chrome-extension/` auswählen

### 2. Gemini API Key holen
1. [Google AI Studio](https://aistudio.google.com/apikey) öffnen
2. Mit Google-Konto anmelden
3. **Create API Key** → kopieren
4. In LiaAI: aufs **Extension-Icon** klicken → Key einfügen → **Speichern**

> Gemini 2.5 Flash ist **gratis** nutzbar (15 Anfragen/Minute, 1.500/Tag). Falls du mehr brauchst: Abrechnung in Google Cloud aktivieren.

---

## Verwendung

### Shortcuts

| Tastenkombination | Funktion |
|---|---|---|
| **Cmd+Shift+Y** | Gesamte Seite per Screenshot analysieren |
| **Cmd+Shift+K** | Markierten Text analysieren |
| **Ctrl+C** | Kopieren = Analyse (wenn Text markiert) |
| **Esc** | Overlay sofort schließen |

> Shortcuts können unter `chrome://extensions/shortcuts` individuell angepasst werden.

### Anzeige-Modi

| Modus | Verhalten |
|---|---|
| **Normal** | Overlay oben rechts, Close-Button, Auto-Dismiss |
| **Stealth** | Mini-Text unten mittig, passt sich Seiten-Stil an, per Klick/Esc weg |
| **Clipboard** | Antwort in Zwischenablage, kurzes "✓ Kopiert" unten rechts |

---

## Konfiguration

| Einstellung | Beschreibung | Default |
|---|---|---|
| Gemini API Key | Erforderlich – von [Google AI Studio](https://aistudio.google.com/apikey) | – |
| Modell | `gemini-2.5-flash` (schnell/günstig) oder `gemini-2.5-pro` (beste Qualität) | Gemini 2.5 Flash |
| Anzeige-Modus | Normal / Stealth / Clipboard | Normal |
| Auto-Dismiss | Selbstzerstörung in Sekunden (nur Stealth) | 6s |
| Kein Lade-Indikator | Kein Spinner im Stealth-Mode (komplett unsichtbar) | Aus |
| Eigener Prompt | Überschreibt den Standard-Few-Shot-Prompt | Leer (Default) |

---

## Technischer Stack

| Komponente | Technologie |
|---|---|
| Extension | Chrome Manifest V3 |
| AI Backend | Google Gemini 2.5 Flash |
| Screenshot | `chrome.tabs.captureVisibleTab()` |
| Content Injection | `chrome.scripting.executeScript()` |
| Storage | `chrome.storage.sync` / `chrome.storage.local` |
| Oberfläche | Vanilla JS, CSS (Glass-Morphism) |

---

## Datenfluss

```
Cmd+Shift+Y
    │
    ▼
chrome.tabs.captureVisibleTab()  ─── JPEG Screenshot (Base64)
    │
    ▼
Gemini 2.5 Flash API  ─── Vision + Antwort (ein API-Call)
    │
    ▼
Content Script  ─── Overlay (Normal / Stealth / Clipboard)
```

---

## Projektstruktur

```
chrome-extension/
├── manifest.json          # Manifest V3
├── background.js          # Service Worker – Screenshot + API
├── content.js             # Content Script – Overlay-Logik
├── content.css            # Overlay-Styling
├── popup/
│   ├── popup.html         # Einstellungen-UI
│   ├── popup.js           
│   └── popup.css          
└── icons/                 # icon-16/48/128.png
```

---

## Lizenz

MIT – siehe [LICENSE](LICENSE)

---

<p align="center">
  <sub>Made with ❤️ for passing exams</sub>
</p>
