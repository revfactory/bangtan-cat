import Foundation
import Vision
import CoreImage
// usage: maskdump <frames_dir>  -> writes m_XXXX.png (all instances mask, frame size)
let dir = CommandLine.arguments[1]
let files = try FileManager.default.contentsOfDirectory(atPath: dir).filter { $0.hasPrefix("f_") && $0.hasSuffix(".jpg") }.sorted()
let ctx = CIContext()
for f in files {
  let url = URL(fileURLWithPath: dir + "/" + f)
  guard let ci = CIImage(contentsOf: url) else { continue }
  let handler = VNImageRequestHandler(ciImage: ci)
  let req = VNGenerateForegroundInstanceMaskRequest()
  try? handler.perform([req])
  guard let r = req.results?.first else { continue }
  if let buf = try? r.generateScaledMaskForImage(forInstances: r.allInstances, from: handler) {
    let m = CIImage(cvPixelBuffer: buf)
    let out = URL(fileURLWithPath: dir + "/" + f.replacingOccurrences(of: "f_", with: "m_").replacingOccurrences(of: ".jpg", with: ".png"))
    try? ctx.writePNGRepresentation(of: m, to: out, format: .L8, colorSpace: CGColorSpaceCreateDeviceGray())
  }
}
print("ok")
