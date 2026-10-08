// Genera el icono de Imperia (1024 px): torre de homenaje dorada sobre fondo pizarra.
import Cocoa

let size = 1024
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8, samplesPerPixel: 4,
                           hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
let ctx = NSGraphicsContext.current!.cgContext
let cs = CGColorSpaceCreateDeviceRGB()
func col(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat, _ a: CGFloat = 1) -> CGColor { CGColor(red: r/255, green: g/255, blue: b/255, alpha: a) }

// base redondeada (rejilla de iconos de macOS)
let base = CGRect(x: 100, y: 100, width: 824, height: 824)
let basePath = CGPath(roundedRect: base, cornerWidth: 186, cornerHeight: 186, transform: nil)
ctx.saveGState()
ctx.setShadow(offset: CGSize(width: 0, height: -14), blur: 30, color: col(0, 0, 0, 0.45))
ctx.addPath(basePath); ctx.setFillColor(col(20, 24, 32)); ctx.fillPath()
ctx.restoreGState()
ctx.saveGState(); ctx.addPath(basePath); ctx.clip()
let bg = CGGradient(colorsSpace: cs, colors: [col(44, 54, 70), col(14, 17, 23)] as CFArray, locations: [0, 1])!
ctx.drawLinearGradient(bg, start: CGPoint(x: 512, y: 924), end: CGPoint(x: 512, y: 100), options: [])
let glow = CGGradient(colorsSpace: cs, colors: [col(216, 180, 106, 0.28), col(216, 180, 106, 0)] as CFArray, locations: [0, 1])!
ctx.drawRadialGradient(glow, startCenter: CGPoint(x: 512, y: 520), startRadius: 0, endCenter: CGPoint(x: 512, y: 520), endRadius: 420, options: [])
// colinas
ctx.setFillColor(col(22, 28, 30)); ctx.addEllipse(in: CGRect(x: 40, y: -40, width: 620, height: 330)); ctx.fillPath()
ctx.setFillColor(col(30, 37, 40)); ctx.addEllipse(in: CGRect(x: 380, y: -80, width: 700, height: 360)); ctx.fillPath()
ctx.restoreGState()

// torre
let gold = CGGradient(colorsSpace: cs, colors: [col(246, 222, 160), col(216, 180, 106), col(150, 112, 50)] as CFArray, locations: [0, 0.5, 1])!
let tower = CGMutablePath()
tower.move(to: CGPoint(x: 372, y: 250))
tower.addLine(to: CGPoint(x: 652, y: 250))
tower.addLine(to: CGPoint(x: 632, y: 610))
tower.addLine(to: CGPoint(x: 668, y: 610))
tower.addLine(to: CGPoint(x: 668, y: 700))
for i in 0..<4 { // almenas
    let x0 = 668 - CGFloat(i) * 84.0
    tower.addLine(to: CGPoint(x: x0, y: 700))
    tower.addLine(to: CGPoint(x: x0, y: 752))
    tower.addLine(to: CGPoint(x: x0 - 42, y: 752))
    tower.addLine(to: CGPoint(x: x0 - 42, y: 700))
}
tower.addLine(to: CGPoint(x: 356, y: 700))
tower.addLine(to: CGPoint(x: 356, y: 610))
tower.addLine(to: CGPoint(x: 392, y: 610))
tower.closeSubpath()
ctx.saveGState()
ctx.setShadow(offset: CGSize(width: 0, height: -8), blur: 22, color: col(0, 0, 0, 0.5))
ctx.addPath(tower); ctx.setFillColor(col(216, 180, 106)); ctx.fillPath()
ctx.restoreGState()
ctx.saveGState(); ctx.addPath(tower); ctx.clip()
ctx.drawLinearGradient(gold, start: CGPoint(x: 360, y: 760), end: CGPoint(x: 660, y: 250), options: [])
ctx.restoreGState()
// puerta y aspilleras
let door = CGMutablePath()
door.move(to: CGPoint(x: 466, y: 250)); door.addLine(to: CGPoint(x: 466, y: 350))
door.addArc(center: CGPoint(x: 512, y: 350), radius: 46, startAngle: .pi, endAngle: 0, clockwise: true)
door.addLine(to: CGPoint(x: 558, y: 250)); door.closeSubpath()
ctx.addPath(door); ctx.setFillColor(col(26, 30, 38)); ctx.fillPath()
ctx.setFillColor(col(26, 30, 38))
ctx.fill(CGRect(x: 500, y: 470, width: 24, height: 70))
ctx.fill(CGRect(x: 500, y: 630, width: 24, height: 44))
// mástil y estandarte
ctx.setFillColor(col(216, 180, 106)); ctx.fill(CGRect(x: 505, y: 752, width: 14, height: 110))
let flagPath = CGMutablePath()
flagPath.move(to: CGPoint(x: 519, y: 858)); flagPath.addCurve(to: CGPoint(x: 660, y: 838), control1: CGPoint(x: 570, y: 876), control2: CGPoint(x: 610, y: 820))
flagPath.addLine(to: CGPoint(x: 630, y: 810)); flagPath.addLine(to: CGPoint(x: 660, y: 782))
flagPath.addCurve(to: CGPoint(x: 519, y: 800), control1: CGPoint(x: 610, y: 768), control2: CGPoint(x: 570, y: 820))
flagPath.closeSubpath()
ctx.addPath(flagPath); ctx.setFillColor(col(200, 64, 46)); ctx.fillPath()
// filete dorado interior
ctx.addPath(CGPath(roundedRect: base.insetBy(dx: 26, dy: 26), cornerWidth: 162, cornerHeight: 162, transform: nil))
ctx.setStrokeColor(col(216, 180, 106, 0.35)); ctx.setLineWidth(5); ctx.strokePath()
NSGraphicsContext.restoreGraphicsState()

let out = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "icon_1024.png"
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
print("icono: \(out)")
