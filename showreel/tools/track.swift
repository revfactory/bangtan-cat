import Foundation
import Vision
import CoreImage
import AppKit
// usage: track <frames_dir> <out.json>  (frames named f_0001.jpg ...)
let dir = CommandLine.arguments[1]
let outPath = CommandLine.arguments[2]
let files = try FileManager.default.contentsOfDirectory(atPath: dir).filter { $0.hasSuffix(".jpg") }.sorted()
var results: [[String: Any]] = []
for f in files {
  let url = URL(fileURLWithPath: dir + "/" + f)
  guard let ci = CIImage(contentsOf: url) else { continue }
  let handler = VNImageRequestHandler(ciImage: ci)
  let req = VNGenerateForegroundInstanceMaskRequest()
  var insts: [[String: Any]] = []
  do {
    try handler.perform([req])
    if let r = req.results?.first {
      // instanceMask: pixel buffer with instance labels (UInt8), at reduced res
      let mask = r.instanceMask
      CVPixelBufferLockBaseAddress(mask, .readOnly)
      let w = CVPixelBufferGetWidth(mask), h = CVPixelBufferGetHeight(mask)
      let bpr = CVPixelBufferGetBytesPerRow(mask)
      let base = CVPixelBufferGetBaseAddress(mask)!.assumingMemoryBound(to: UInt8.self)
      // full-res RGB for colour stats
      let ctx = CIContext()
      let cg = ctx.createCGImage(ci, from: ci.extent)!
      let W = cg.width, H = cg.height
      let rep = NSBitmapImageRep(cgImage: cg)
      for inst in r.allInstances {
        var minx = w, miny = h, maxx = 0, maxy = 0, cnt = 0
        var sx = 0.0, sy = 0.0, sr = 0.0, sg = 0.0, sb = 0.0, dark = 0, orange = 0, white = 0, samples = 0
        for y in 0..<h { for x in 0..<w {
          if Int(base[y*bpr + x]) == inst {
            cnt += 1; sx += Double(x); sy += Double(y)
            minx = min(minx, x); maxx = max(maxx, x); miny = min(miny, y); maxy = max(maxy, y)
            if (x + y) % 3 == 0 {
              let px = Int(Double(x) / Double(w) * Double(W)), py = Int(Double(y) / Double(h) * Double(H))
              if let c = rep.colorAt(x: px, y: py) {
                let rr = Double(c.redComponent), gg = Double(c.greenComponent), bb = Double(c.blueComponent)
                sr += rr; sg += gg; sb += bb; samples += 1
                let mx = max(rr, gg, bb), mn = min(rr, gg, bb)
                if mx < 0.22 { dark += 1 }
                if rr > 0.5 && rr - bb > 0.22 && rr > gg { orange += 1 }
                if mn > 0.75 { white += 1 }
              }
            }
          }
        }}
        if cnt == 0 { continue }
        let s = Double(max(samples, 1))
        insts.append(["id": inst, "area": Double(cnt) / Double(w*h),
          "cx": sx/Double(cnt)/Double(w), "cy": sy/Double(cnt)/Double(h),
          "x0": Double(minx)/Double(w), "y0": Double(miny)/Double(h), "x1": Double(maxx+1)/Double(w), "y1": Double(maxy+1)/Double(h),
          "dark": Double(dark)/s, "orange": Double(orange)/s, "white": Double(white)/s])
      }
      CVPixelBufferUnlockBaseAddress(mask, .readOnly)
    }
  } catch { }
  results.append(["file": f, "instances": insts])
}
let data = try JSONSerialization.data(withJSONObject: results, options: [.prettyPrinted])
try data.write(to: URL(fileURLWithPath: outPath))
print("done", results.count)
