@echo off
REM LiaAI Windows Build Script
REM Erstellt eine native Windows x64 App aus dem .NET-Quellcode.
REM Voraussetzungen: .NET 8 SDK
REM Ausgabe: .\build\LiaAI.exe (self-contained single file)

cd /d "%~dp0LiaAI"

echo ==^> Baue LiaAI fuer Windows x64...
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:EnableCompressionInSingleFile=true -o ..\build

echo.
echo ==^> Fertig!
echo     App: build\LiaAI.exe
echo.
echo ==^> Starten:
echo     build\LiaAI.exe
echo.
echo ==^> Optional: Verknuepfung in Autostart legen:
echo     shell:startup
