// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "LiaAI",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "LiaAI",
            path: "Sources/LiaAI"
        ),
    ]
)
