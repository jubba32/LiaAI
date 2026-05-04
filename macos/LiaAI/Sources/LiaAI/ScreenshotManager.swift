import Cocoa
import UniformTypeIdentifiers

struct ScreenshotManager {
    static func captureMainDisplay() -> Data? {
        guard let screen = NSScreen.main else { return nil }
        let rect = screen.frame
        guard let cgImage = CGWindowListCreateImage(rect, .optionOnScreenOnly, kCGNullWindowID, .bestResolution) else {
            return nil
        }
        return NSImage(cgImage: cgImage, size: rect.size).jpegData(compression: 0.8)
    }

    static func captureActiveWindow() -> Data? {
        let windowList = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements], kCGNullWindowID)
            as? [[String: Any]] ?? []

        guard let frontWindow = windowList.first(where: {
            ($0[kCGWindowLayer as String] as? Int32 ?? 99) == 0
        }) else {
            return captureMainDisplay()
        }

        let bounds = frontWindow[kCGWindowBounds as String] as? [String: CGFloat] ?? [:]
        let rect = CGRect(
            x: bounds["X"] ?? 0,
            y: bounds["Y"] ?? 0,
            width: bounds["Width"] ?? 800,
            height: bounds["Height"] ?? 600
        )

        guard let cgImage = CGWindowListCreateImage(rect, .optionOnScreenOnly,
            frontWindow[kCGWindowNumber as String] as? CGWindowID ?? 0,
            .bestResolution)
        else {
            return captureMainDisplay()
        }

        let bitmap = NSBitmapImageRep(cgImage: cgImage)
        return bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.8])
    }
}

extension NSImage {
    func jpegData(compression: CGFloat) -> Data? {
        guard let tiff = tiffRepresentation,
              let bitmap = NSBitmapImageRep(data: tiff) else { return nil }
        return bitmap.representation(using: .jpeg, properties: [.compressionFactor: compression])
    }
}
