import AppKit
import PDFKit
import Foundation

// Render every page with the macOS PDF engine for visual quality review.
for input in CommandLine.arguments.dropFirst() {
    let url = URL(fileURLWithPath: input)
    guard let document = PDFDocument(url: url) else { fatalError("Cannot open PDF: \(input)") }
    let output = url.deletingLastPathComponent().appendingPathComponent("previews")
    try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
    for index in 0..<document.pageCount {
        guard let page = document.page(at: index) else { fatalError("Missing PDF page") }
        let rect = page.bounds(for: .mediaBox)
        let scale: CGFloat = 1.8
        let width = Int(ceil(rect.width * scale)), height = Int(ceil(rect.height * scale))
        guard let bitmap = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0), let graphics = NSGraphicsContext(bitmapImageRep: bitmap) else { fatalError("Cannot create renderer") }
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = graphics
        graphics.cgContext.setFillColor(NSColor.white.cgColor)
        graphics.cgContext.fill(CGRect(x: 0, y: 0, width: width, height: height))
        graphics.cgContext.scaleBy(x: scale, y: scale)
        page.draw(with: .mediaBox, to: graphics.cgContext)
        NSGraphicsContext.restoreGraphicsState()
        guard let data = bitmap.representation(using: .png, properties: [:]) else { fatalError("PNG failed") }
        let target = output.appendingPathComponent(url.deletingPathExtension().lastPathComponent + "-page-\(index + 1).png")
        try data.write(to: target)
        print(target.path)
    }
}
