import Foundation
import Vision
import CoreImage
import AppKit

// usage: cutout <input> <outprefix>
// writes <outprefix>_all.png (all instances) and <outprefix>_i<N>.png per instance
let args = CommandLine.arguments
let input = URL(fileURLWithPath: args[1])
let prefix = args[2]
guard let ciImage = CIImage(contentsOf: input, options: [.applyOrientationProperty: true]) else { fatalError("load fail") }
let handler = VNImageRequestHandler(ciImage: ciImage)
let req = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([req])
guard let result = req.results?.first else { print("no subject"); exit(1) }
let ctx = CIContext()
func save(_ instances: IndexSet, _ path: String) throws {
  let buf = try result.generateMaskedImage(ofInstances: instances, from: handler, croppedToInstancesExtent: false)
  let img = CIImage(cvPixelBuffer: buf)
  let cs = CGColorSpace(name: CGColorSpace.sRGB)!
  try ctx.writePNGRepresentation(of: img, to: URL(fileURLWithPath: path), format: .RGBA8, colorSpace: cs)
  print("wrote", path)
}
print("instances:", result.allInstances.map { $0 })
try save(result.allInstances, prefix + "_all.png")
for i in result.allInstances { try save(IndexSet(integer: i), prefix + "_i\(i).png") }
