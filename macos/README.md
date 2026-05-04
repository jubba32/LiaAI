# LiaAI – macOS (Apple Silicon)

Native macOS App für KI-gestützte Screenshot-Analyse – powered by Google Gemini.

## Features

- **System Tray** – Icon in der Menüleiste, kein Dock-Eintrag
- **Cmd+Shift+Y** – Screenshot des aktiven Fensters → Gemini-Antwort
- **Cmd+Shift+K** – Markierten Text analysieren
- **Floating Overlay** – Antwort erscheint als schwebendes Overlay-Fenster
- **Glass-Morphism** – Halbtransparentes Design mit Blur
- **Auto-Dismiss** – Konfigurierbare Selbstzerstörung
- **Einstellungen** – API-Key, Modell, Anzeige-Modus, eigener Prompt

## Voraussetzungen

- macOS 13+ (Ventura oder neuer)
- Apple Silicon (M1/M2/M3/M4)
- Xcode 15+ oder Command Line Tools (Swift 5.9+)

## Bauen & Starten

```bash
cd macOS
./build.sh
open build/LiaAI.app
```

## Verwendung

1. App starten – LiaAI erscheint in der Menüleiste
2. Erstes Mal: Menüleiste → **Einstellungen** → Gemini API Key eintragen
3. **Cmd+Shift+Y** = Screenshot-Analyse
4. Antwort erscheint als Overlay zentriert unten

## Deinstallation

```bash
# Aus Autostart entfernen:
# Systemeinstellungen → Allgemein → Anmeldeobjekte → LiaAI entfernen

# App löschen:
rm -rf /Applications/LiaAI.app
```
