import Cocoa

class OverlayWindow: NSWindow {
    init(text: String?, loading: Bool) {
        let contentRect = NSRect(x: 0, y: 0, width: 360, height: 120)
        super.init(
            contentRect: contentRect,
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )

        self.isOpaque = false
        self.backgroundColor = .clear
        self.level = .floating
        self.collectionBehavior = [.canJoinAllSpaces, .stationary, .ignoresCycle]
        self.hasShadow = true
        self.isMovableByWindowBackground = true

        let contentView = NSView(frame: contentRect)
        contentView.wantsLayer = true
        contentView.layer?.cornerRadius = 10
        contentView.layer?.masksToBounds = true

        // Glass-morphism background
        let bg = NSVisualEffectView(frame: contentRect)
        bg.material = .hudWindow
        bg.blendingMode = .behindWindow
        bg.state = .active
        bg.wantsLayer = true
        bg.layer?.cornerRadius = 10
        contentView.addSubview(bg)

        // Close button
        let closeBtn = NSButton(frame: NSRect(x: contentRect.width - 28, y: contentRect.height - 28, width: 20, height: 20))
        closeBtn.title = "×"
        closeBtn.isBordered = false
        closeBtn.font = NSFont.systemFont(ofSize: 14)
        closeBtn.target = self
        closeBtn.action = #selector(close)
        contentView.addSubview(closeBtn)

        if loading {
            let spinner = NSProgressIndicator(frame: NSRect(x: (contentRect.width - 24) / 2, y: (contentRect.height - 24) / 2, width: 24, height: 24))
            spinner.style = .spinning
            spinner.startAnimation(nil)
            contentView.addSubview(spinner)
        } else if let text = text {
            let label = NSTextField(frame: NSRect(x: 14, y: 10, width: contentRect.width - 48, height: contentRect.height - 20))
            label.stringValue = text
            label.isEditable = false
            label.isBordered = false
            label.drawsBackground = false
            label.textColor = .white
            label.font = NSFont.systemFont(ofSize: 12)
            label.lineBreakMode = .byWordWrapping
            contentView.addSubview(label)
        }

        self.contentView = contentView

        // Position bottom-center of screen
        if let screen = NSScreen.main {
            let screenRect = screen.visibleFrame
            let x = screenRect.midX - contentRect.width / 2
            let y = screenRect.minY + 12
            self.setFrameOrigin(NSPoint(x: x, y: y))
        }

        // Auto-dismiss
        let dismissSec = UserDefaults.standard.double(forKey: "autoDismiss")
        if dismissSec > 0 && !loading {
            DispatchQueue.main.asyncAfter(deadline: .now() + dismissSec) { [weak self] in
                self?.close()
            }
        }
    }

    func show() {
        self.makeKeyAndOrderFront(nil)
    }
}
