# LiaAI – Windows (64-bit)

Native Windows App für KI-gestützte Screenshot-Analyse – powered by Google Gemini.

## Features

- **System Tray** – Icon im Infobereich, kein Taskleisten-Eintrag
- **Ctrl+Shift+Y** – Screenshot des aktiven Fensters → Gemini-Antwort
- **Ctrl+Shift+K** – Markierten Text analysieren
- **Floating Overlay** – Antwort erscheint als schwebendes Overlay-Fenster
- **Acrylic-Design** – Modernes, halbtransparentes Fenster
- **Auto-Dismiss** – Konfigurierbare Selbstzerstörung
- **Einstellungen** – API-Key, Modell, Anzeige-Modus, eigener Prompt

## Voraussetzungen

- Windows 10+ (64-bit)
- .NET 8 SDK (zum Bauen)
- Oder: fertige `LiaAI.exe` aus Releases (kein SDK nötig)

## Bauen & Starten

```cmd
cd windows
build.bat
build\LiaAI.exe
```

## Verwendung

1. App starten – LiaAI erscheint im Infobereich (neben der Uhr)
2. Erstes Mal: Rechtsklick aufs Tray-Icon → **Einstellungen** → Gemini API Key eintragen
3. **Ctrl+Shift+Y** = Screenshot-Analyse
4. Antwort erscheint als Overlay zentriert unten

## Deinstallation

```cmd
# App schließen (Tray → Beenden)
# build\ Ordner löschen
# Optional: Registry-Einträge entfernen über regedit:
# HKCU\Software\LiaAI
```
