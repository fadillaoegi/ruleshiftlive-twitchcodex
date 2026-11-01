import Foundation
import Vision

for input in CommandLine.arguments.dropFirst() {
    let request = VNDetectBarcodesRequest()
    request.usesCPUOnly = true
    request.symbologies = [.qr]
    let handler = VNImageRequestHandler(url: URL(fileURLWithPath: input), options: [:])
    try handler.perform([request])
    let codes = (request.results ?? []).compactMap { $0.payloadStringValue }
    guard codes.contains("https://youtu.be/AvWHm6U2jUs") else { fatalError("Missing or incorrect demo QR in \(input)") }
    print("Verified YouTube QR: \(input)")
}
