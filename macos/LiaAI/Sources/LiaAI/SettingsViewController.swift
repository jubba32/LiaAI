import Cocoa

class SettingsViewController: NSViewController {
    private var apiKeyField: NSTextField!
    private var modelPopup: NSPopUpButton!
    private var displayModePopup: NSPopUpButton!
    private var autoDismissPopup: NSPopUpButton!
    private var customPromptField: NSTextView!
    private var statusLabel: NSTextField!

    override func loadView() {
        view = NSView(frame: NSRect(x: 0, y: 0, width: 380, height: 460))
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        loadSettings()
    }

    private func setupUI() {
        var y: CGFloat = 430

        func addLabel(_ text: String) {
            let label = NSTextField(labelWithString: text)
            label.font = NSFont.systemFont(ofSize: 10, weight: .semibold)
            label.textColor = .secondaryLabelColor
            label.frame = NSRect(x: 20, y: y, width: 340, height: 14)
            view.addSubview(label)
            y -= 20
        }

        func addSeparator() {
            let box = NSBox(frame: NSRect(x: 20, y: y, width: 340, height: 1))
            box.boxType = .separator
            view.addSubview(box)
            y -= 16
        }

        // API Key
        addLabel("GEMINI API KEY")
        apiKeyField = NSSecureTextField(frame: NSRect(x: 20, y: y, width: 290, height: 24))
        view.addSubview(apiKeyField)
        let toggleBtn = NSButton(frame: NSRect(x: 318, y: y, width: 44, height: 24))
        toggleBtn.title = "👁"
        toggleBtn.isBordered = false
        toggleBtn.target = self
        toggleBtn.action = #selector(toggleApiKeyVisibility)
        view.addSubview(toggleBtn)
        y -= 44

        let keyHint = NSTextField(labelWithString: "Von aistudio.google.com/apikey")
        keyHint.font = NSFont.systemFont(ofSize: 9)
        keyHint.textColor = .tertiaryLabelColor
        keyHint.frame = NSRect(x: 20, y: y, width: 340, height: 12)
        view.addSubview(keyHint)
        y -= 26

        // Model
        addLabel("MODELL")
        modelPopup = NSPopUpButton(frame: NSRect(x: 20, y: y, width: 340, height: 24))
        modelPopup.addItems(withTitles: ["Gemini 2.5 Flash (schnell)", "Gemini 2.5 Pro (Qualität)"])
        modelPopup.itemArray[0].representedObject = "gemini-2.5-flash"
        modelPopup.itemArray[1].representedObject = "gemini-2.5-pro"
        view.addSubview(modelPopup)
        y -= 44

        // Display Mode
        addLabel("ANZEIGE-MODUS")
        displayModePopup = NSPopUpButton(frame: NSRect(x: 20, y: y, width: 340, height: 24))
        displayModePopup.addItems(withTitles: ["Normal – Overlay oben rechts", "Stealth – Mini-Text unten mittig", "Clipboard – Nur Zwischenablage"])
        displayModePopup.itemArray[0].representedObject = "normal"
        displayModePopup.itemArray[1].representedObject = "stealth"
        displayModePopup.itemArray[2].representedObject = "clipboard"
        view.addSubview(displayModePopup)
        y -= 44

        // Auto Dismiss
        addLabel("AUTO-DISMISS (Stealth)")
        autoDismissPopup = NSPopUpButton(frame: NSRect(x: 20, y: y, width: 340, height: 24))
        autoDismissPopup.addItems(withTitles: ["3 Sekunden", "6 Sekunden", "10 Sekunden", "20 Sekunden"])
        autoDismissPopup.itemArray[0].representedObject = 3
        autoDismissPopup.itemArray[1].representedObject = 6
        autoDismissPopup.itemArray[2].representedObject = 10
        autoDismissPopup.itemArray[3].representedObject = 20
        view.addSubview(autoDismissPopup)
        y -= 44

        // Prompt
        addLabel("EIGENER SYSTEM-PROMPT")
        let scrollView = NSScrollView(frame: NSRect(x: 20, y: y - 60, width: 340, height: 60))
        scrollView.hasVerticalScroller = true
        scrollView.borderType = .bezelBorder
        customPromptField = NSTextView(frame: NSRect(x: 0, y: 0, width: 320, height: 60))
        customPromptField.font = NSFont.monospacedSystemFont(ofSize: 10, weight: .regular)
        scrollView.documentView = customPromptField
        view.addSubview(scrollView)
        y -= 84

        // Save button
        let saveBtn = NSButton(frame: NSRect(x: 20, y: y, width: 100, height: 28))
        saveBtn.title = "Speichern"
        saveBtn.bezelStyle = .rounded
        saveBtn.keyEquivalent = "\r"
        saveBtn.target = self
        saveBtn.action = #selector(saveSettings)
        view.addSubview(saveBtn)

        statusLabel = NSTextField(labelWithString: "")
        statusLabel.frame = NSRect(x: 130, y: y + 6, width: 230, height: 14)
        statusLabel.font = NSFont.systemFont(ofSize: 11)
        view.addSubview(statusLabel)
    }

    private func loadSettings() {
        let defaults = UserDefaults.standard
        apiKeyField.stringValue = defaults.string(forKey: "geminiKey") ?? ""
        customPromptField.string = defaults.string(forKey: "customPrompt") ?? ""

        if let model = defaults.string(forKey: "model") {
            modelPopup.selectItem(withTitle: model == "gemini-2.5-pro" ? "Gemini 2.5 Pro (Qualität)" : "Gemini 2.5 Flash (schnell)")
        }

        if let mode = defaults.string(forKey: "displayMode") {
            for item in displayModePopup.itemArray {
                if item.representedObject as? String == mode {
                    displayModePopup.select(item)
                    break
                }
            }
        }

        let dismiss = defaults.double(forKey: "autoDismiss")
        if dismiss > 0 {
            for item in autoDismissPopup.itemArray {
                if item.representedObject as? Int == Int(dismiss) {
                    autoDismissPopup.select(item)
                    break
                }
            }
        } else {
            autoDismissPopup.selectItem(at: 1) // default 6s
        }
    }

    @objc private func toggleApiKeyVisibility() {
        if let secure = apiKeyField {
            // Toggle between secure and plain text
            let wasSecure = secure is NSSecureTextField
            if wasSecure {
                let field = NSTextField(frame: secure.frame)
                field.stringValue = secure.stringValue
                view.replaceSubview(secure, with: field)
                apiKeyField = field
            } else {
                let secureField = NSSecureTextField(frame: secure.frame)
                secureField.stringValue = secure.stringValue
                view.replaceSubview(secure, with: secureField)
                apiKeyField = secureField
            }
        }
    }

    @objc private func saveSettings() {
        let defaults = UserDefaults.standard
        defaults.set(apiKeyField.stringValue, forKey: "geminiKey")

        if let model = modelPopup.selectedItem?.representedObject as? String {
            defaults.set(model, forKey: "model")
        }

        if let mode = displayModePopup.selectedItem?.representedObject as? String {
            defaults.set(mode, forKey: "displayMode")
        }

        if let dismiss = autoDismissPopup.selectedItem?.representedObject as? Int {
            defaults.set(Double(dismiss), forKey: "autoDismiss")
        }

        defaults.set(customPromptField.string, forKey: "customPrompt")

        statusLabel.stringValue = "Gespeichert!"
        statusLabel.textColor = .systemGreen
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { [weak self] in
            self?.statusLabel.stringValue = ""
        }
    }
}
