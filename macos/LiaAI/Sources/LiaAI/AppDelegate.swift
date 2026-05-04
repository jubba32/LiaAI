import Cocoa
import Carbon

class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem!
    private var overlayWindow: OverlayWindow?
    private var settingsWindow: NSWindow?
    private var hotkeyRef: EventHotKeyRef?

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupMenuBar()
        registerHotkey()
        NSApp.setActivationPolicy(.accessory)
    }

    private func setupMenuBar() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        statusItem.button?.title = "LiaAI"
        let menu = NSMenu()
        menu.addItem(NSMenuItem(title: "Analysieren (Cmd+Shift+Y)", action: #selector(triggerAnalysis), keyEquivalent: ""))
        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "Einstellungen", action: #selector(openSettings), keyEquivalent: ","))
        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "Beenden", action: #selector(quitApp), keyEquivalent: "q"))
        statusItem.menu = menu
    }

    private func registerHotkey() {
        var eventType = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: OSType(kEventHotKeyPressed))
        InstallEventHandler(GetApplicationEventTarget(), { (_, event, _) -> OSStatus in
            let appDelegate = NSApp.delegate as! AppDelegate
            DispatchQueue.main.async { appDelegate.triggerAnalysis() }
            return noErr
        }, 1, &eventType, nil, nil)

        // Cmd+Shift+Y
        var gHotKey = EventHotKeyID()
        gHotKey.signature = OSType(0x4C494141) // "LIAA"
        gHotKey.id = 1

        RegisterEventHotKey(
            UInt32(kVK_ANSI_Y),
            UInt32(cmdKey | shiftKey),
            gHotKey,
            GetApplicationEventTarget(),
            0,
            &hotkeyRef
        )

        // Cmd+Shift+K (selection mode)
        gHotKey.id = 2
        RegisterEventHotKey(
            UInt32(kVK_ANSI_K),
            UInt32(cmdKey | shiftKey),
            gHotKey,
            GetApplicationEventTarget(),
            0,
            &hotkeyRef
        )
    }

    @objc func triggerAnalysis() {
        showOverlay(text: nil, loading: true)

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self else { return }
            Task {
                do {
                    guard let screenshot = ScreenshotManager.captureActiveWindow() else {
                        throw NSError(domain: "LiaAI", code: 1, userInfo: [NSLocalizedDescriptionKey: "Screenshot fehlgeschlagen"])
                    }
                    let base64 = screenshot.base64EncodedString()
                    let answer = try await GeminiService.shared.analyze(imageBase64: base64)

                    await MainActor.run {
                        self.showOverlay(text: answer, loading: false)
                    }
                } catch {
                    await MainActor.run {
                        self.showOverlay(text: "Fehler: \(error.localizedDescription)", loading: false)
                    }
                }
            }
        }
    }

    private func showOverlay(text: String?, loading: Bool) {
        overlayWindow?.close()
        overlayWindow = OverlayWindow(text: text, loading: loading)
        overlayWindow?.show()
    }

    @objc func openSettings() {
        if settingsWindow == nil {
            let vc = SettingsViewController()
            let window = NSWindow(contentViewController: vc)
            window.title = "LiaAI Einstellungen"
            window.styleMask = [.titled, .closable, .miniaturizable]
            window.setContentSize(NSSize(width: 380, height: 420))
            window.center()
            settingsWindow = window
        }
        settingsWindow?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    @objc func quitApp() {
        NSApp.terminate(nil)
    }
}
