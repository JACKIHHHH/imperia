// Imperia — app nativa de macOS: ventana con WKWebView que carga el juego empaquetado.
import Cocoa
import WebKit
import Network
import AVFoundation

final class GameView: WKWebView {
    override func acceptsFirstMouse(for event: NSEvent?) -> Bool { true }
    override func willOpenMenu(_ menu: NSMenu, with event: NSEvent) { menu.removeAllItems() }
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var window: NSWindow!
    var web: GameView!
    lazy var net: LanNet = LanNet { [weak self] json in
        self?.web.evaluateJavaScript("window.__net && window.__net(\(json))", completionHandler: nil)
    }
    var synth = AVSpeechSynthesizer()
    var speakStart = Date.distantPast

    // Voz del sistema. Si el sintetizador se queda "hablando" sin terminar (se cuelga tras cortar una frase), se sustituye por uno nuevo.
    private func handleVoice(_ body: Any) {
        guard let m = body as? [String: Any], let text = m["text"] as? String, !text.isEmpty else { return }
        let urgent = (m["urgent"] as? Bool) == true
        if synth.isSpeaking && Date().timeIntervalSince(speakStart) > 10 {
            synth.stopSpeaking(at: .immediate)
            synth = AVSpeechSynthesizer()
        }
        if synth.isSpeaking && !urgent { return }
        let u = AVSpeechUtterance(string: String(text.prefix(120)))
        u.voice = AVSpeechSynthesisVoice(language: (m["lang"] as? String) ?? "es-ES")
        u.rate = Float((m["rate"] as? Double) ?? 0.52)
        u.pitchMultiplier = Float((m["pitch"] as? Double) ?? 1.0)
        u.volume = Float((m["vol"] as? Double) ?? 0.9)
        let s = synth
        speakStart = Date()
        if s.isSpeaking {
            s.stopSpeaking(at: .immediate)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { s.speak(u) }
        } else {
            s.speak(u)
        }
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()
        let cfg = WKWebViewConfiguration()
        let uc = WKUserContentController()
        uc.add(self, name: "log")
        uc.add(self, name: "store")
        uc.add(self, name: "net")
        uc.add(self, name: "voice")
        uc.add(self, name: "nativeApp")
        let hook = """
        (function(){function s(t,a){try{window.webkit.messageHandlers.log.postMessage(t+': '+Array.prototype.map.call(a,String).join(' '))}catch(e){}}
        ['error','warn','log'].forEach(function(k){var o=console[k];console[k]=function(){s(k,arguments);o.apply(console,arguments)}});
        window.addEventListener('error',function(e){s('uncaught',[e.message+' @'+(e.filename||'')+':'+e.lineno])});})();
        """
        uc.addUserScript(WKUserScript(source: hook, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        cfg.userContentController = uc
        cfg.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        cfg.mediaTypesRequiringUserActionForPlayback = []
        // la simulación en red debe seguir aunque la ventana quede oculta o en segundo plano
        if #available(macOS 14.0, *) { cfg.preferences.inactiveSchedulingPolicy = .none }

        web = GameView(frame: .zero, configuration: cfg)
        web.setValue(false, forKey: "drawsBackground")
        web.navigationDelegate = self
        if #available(macOS 13.3, *) { web.isInspectable = true }

        let vf = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        let w = min(1680, vf.width * 0.92), h = min(1050, vf.height * 0.92)
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: w, height: h),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered, defer: false)
        window.title = "Imperia"
        window.titlebarAppearsTransparent = true
        window.appearance = NSAppearance(named: .darkAqua)
        window.backgroundColor = NSColor(red: 0.027, green: 0.031, blue: 0.039, alpha: 1)
        window.minSize = NSSize(width: 1100, height: 700)
        window.collectionBehavior = [.fullScreenPrimary]
        window.contentView = web
        window.center()
        window.setFrameAutosaveName("ImperiaMainWindow")
        window.makeKeyAndOrderFront(nil)
        window.makeFirstResponder(web)

        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web") {
            web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        NSApp.activate(ignoringOtherApps: true)
        // Arranca a pantalla completa (IMPERIA_WINDOWED=1 lo evita en las pruebas automáticas)
        if ProcessInfo.processInfo.environment["IMPERIA_WINDOWED"] == nil {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
                guard let w = self?.window, !w.styleMask.contains(.fullScreen) else { return }
                w.toggleFullScreen(nil)
            }
        }
        // Pulso nativo: WebKit ralentiza los temporizadores de una ventana tapada u oculta; esto mantiene viva la simulación (sobre todo en red)
        pulse = Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { [weak self] _ in
            guard let w = self?.web, let win = self?.window else { return }
            if !win.occlusionState.contains(.visible) || win.isMiniaturized { w.evaluateJavaScript("window.__nativeTick&&window.__nativeTick()", completionHandler: nil) }
        }
        RunLoop.main.add(pulse!, forMode: .common)
    }
    var pulse: Timer?

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "store" { handleStore(message.body); return }
        if message.name == "net" { net.handle(message.body); return }
        if message.name == "voice" { handleVoice(message.body); return }
        if message.name == "nativeApp", let m = message.body as? [String: Any], let cmd = m["cmd"] as? String {
            switch cmd {
            case "quit": NSApplication.shared.terminate(nil)
            case "fullscreen": window.toggleFullScreen(nil)
            default: break
            }
            return
        }
        if let d = "[web] \(message.body)\n".data(using: .utf8) { FileHandle.standardError.write(d) }
    }

    // Partidas guardadas y opciones en ~/Library/Application Support/Imperia
    private lazy var storeDir: URL = {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let dir = base.appendingPathComponent("Imperia", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }()

    private func handleStore(_ body: Any) {
        guard let m = body as? [String: Any], let id = m["id"] as? Int, let op = m["op"] as? String,
              let rawKey = m["key"] as? String else { return }
        let key = String(rawKey.filter { $0.isLetter || $0.isNumber || $0 == "_" }.prefix(40))
        let url = storeDir.appendingPathComponent(key + ".json")
        var reply = "null"
        if op == "write", let data = m["data"] as? String {
            do { try data.write(to: url, atomically: true, encoding: .utf8); reply = "true" } catch { reply = "false" }
        } else if op == "read", let s = try? String(contentsOf: url, encoding: .utf8),
                  let enc = try? JSONSerialization.data(withJSONObject: [s]), let arr = String(data: enc, encoding: .utf8) {
            reply = String(arr.dropFirst().dropLast())
        }
        web.evaluateJavaScript("window.__storeReply(\(id), \(reply))", completionHandler: nil)
    }

    // Modo de prueba: IMPERIA_EVAL ejecuta JavaScript al terminar de cargar (solo para pruebas automáticas)
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if let js = ProcessInfo.processInfo.environment["IMPERIA_EVAL"], !js.isEmpty {
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) { webView.evaluateJavaScript(js) { _, err in if let e = err { FileHandle.standardError.write("[eval] \(e)\n".data(using: .utf8)!) } } }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    private func buildMenu() {
        let main = NSMenu()
        let appItem = NSMenuItem(); main.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "Acerca de Imperia", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Ocultar Imperia", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Salir de Imperia", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu

        let viewItem = NSMenuItem(); main.addItem(viewItem)
        let viewMenu = NSMenu(title: "Visualización")
        let fs = NSMenuItem(title: "Pantalla completa", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        fs.keyEquivalentModifierMask = [.command, .control]
        viewMenu.addItem(fs)
        viewItem.submenu = viewMenu

        let winItem = NSMenuItem(); main.addItem(winItem)
        let winMenu = NSMenu(title: "Ventana")
        winMenu.addItem(withTitle: "Minimizar", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        winItem.submenu = winMenu
        NSApp.mainMenu = main
    }
}

// Red local: servidor TCP con anuncio Bonjour y clientes. Mensajes JSON delimitados por salto de línea.
final class LanNet {
    let emit: (String) -> Void
    let q = DispatchQueue(label: "imperia.net")
    var listener: NWListener?
    var browser: NWBrowser?
    var conns: [Int: NWConnection] = [:]
    var bufs: [Int: Data] = [:]
    var nextId = 1
    var activity: NSObjectProtocol?
    static let service = "_imperia._tcp"
    init(emit: @escaping (String) -> Void) { self.emit = emit }

    private func send(_ obj: [String: Any]) {
        guard let d = try? JSONSerialization.data(withJSONObject: obj), let s = String(data: d, encoding: .utf8) else { return }
        DispatchQueue.main.async { self.emit(s) }
    }

    func handle(_ body: Any) {
        guard let m = body as? [String: Any], let op = m["op"] as? String else { return }
        q.async {
            switch op {
            case "host": self.host(name: (m["name"] as? String) ?? "Imperia", port: UInt16((m["port"] as? Int) ?? 47800))
            case "join": self.join(host: (m["host"] as? String) ?? "127.0.0.1", port: UInt16((m["port"] as? Int) ?? 47800))
            case "joinService": self.joinService(name: (m["name"] as? String) ?? "")
            case "browse": self.browse()
            case "stopBrowse": self.browser?.cancel(); self.browser = nil
            case "send": if let id = m["id"] as? Int, let d = m["data"] as? String { self.write(id, d) }
            case "broadcast": if let d = m["data"] as? String { for id in self.conns.keys { self.write(id, d) } }
            case "kick": if let id = m["id"] as? Int { self.conns[id]?.cancel() }
            case "close": self.closeAll()
            case "ips": self.send(["type": "ips", "ips": LanNet.localIPs()])
            default: break
            }
        }
    }

    // Evita App Nap mientras haya una sala o partida en red: el anfitrión no puede ralentizarse
    func keepAwake(_ on: Bool) {
        if on, activity == nil { activity = ProcessInfo.processInfo.beginActivity(options: [.userInitiated, .latencyCritical, .idleSystemSleepDisabled], reason: "Partida en red de Imperia") }
        if !on, let a = activity { ProcessInfo.processInfo.endActivity(a); activity = nil }
    }

    func closeAll() {
        keepAwake(false)
        listener?.cancel(); listener = nil; browser?.cancel(); browser = nil
        for c in conns.values { c.cancel() }; conns.removeAll(); bufs.removeAll()
    }

    func host(name: String, port: UInt16) {
        closeAll()
        let tcp = NWProtocolTCP.Options(); tcp.noDelay = true
        let params = NWParameters(tls: nil, tcp: tcp); params.allowLocalEndpointReuse = true
        do {
            let l = try NWListener(using: params, on: NWEndpoint.Port(rawValue: port)!)
            l.service = NWListener.Service(name: name, type: LanNet.service)
            l.stateUpdateHandler = { [weak self] st in
                switch st {
                case .ready: self?.send(["type": "hosted", "port": Int(port), "ips": LanNet.localIPs()])
                case .failed(let e): self?.send(["type": "error", "msg": "No se pudo abrir el puerto \(port): \(e.localizedDescription)"])
                default: break
                }
            }
            l.newConnectionHandler = { [weak self] c in self?.adopt(c) }
            l.start(queue: q); listener = l; keepAwake(true)
        } catch { send(["type": "error", "msg": "No se pudo crear la partida: \(error.localizedDescription)"]) }
    }

    func join(host: String, port: UInt16) {
        closeAll()
        let tcp = NWProtocolTCP.Options(); tcp.noDelay = true; tcp.connectionTimeout = 6
        adopt(NWConnection(host: NWEndpoint.Host(host), port: NWEndpoint.Port(rawValue: port)!, using: NWParameters(tls: nil, tcp: tcp))); keepAwake(true)
    }

    func joinService(name: String) {
        closeAll()
        let tcp = NWProtocolTCP.Options(); tcp.noDelay = true; tcp.connectionTimeout = 6
        adopt(NWConnection(to: .service(name: name, type: LanNet.service, domain: "local.", interface: nil), using: NWParameters(tls: nil, tcp: tcp))); keepAwake(true)
    }

    func browse() {
        browser?.cancel()
        let b = NWBrowser(for: .bonjour(type: LanNet.service, domain: nil), using: NWParameters())
        b.browseResultsChangedHandler = { [weak self] results, _ in
            var names: [String] = []
            for r in results { if case let .service(name, _, _, _) = r.endpoint { names.append(name) } }
            self?.send(["type": "peers", "list": names])
        }
        b.stateUpdateHandler = { [weak self] st in if case .failed(let e) = st { self?.send(["type": "error", "msg": "Búsqueda en la red: \(e.localizedDescription)"]) } }
        b.start(queue: q); browser = b
    }

    private func adopt(_ c: NWConnection) {
        let id = nextId; nextId += 1; conns[id] = c; bufs[id] = Data()
        c.stateUpdateHandler = { [weak self] st in
            guard let self = self else { return }
            switch st {
            case .ready:
                var addr = ""
                if case let .hostPort(h, _) = c.endpoint { addr = "\(h)" }
                self.send(["type": "open", "id": id, "addr": addr])
                self.receive(id, c)
            case .failed(let e): self.drop(id, "\(e.localizedDescription)")
            case .cancelled: self.drop(id, "")
            default: break
            }
        }
        c.start(queue: q)
    }

    private func drop(_ id: Int, _ why: String) {
        guard conns.removeValue(forKey: id) != nil else { return }
        bufs.removeValue(forKey: id); send(["type": "close", "id": id, "why": why])
    }

    private func receive(_ id: Int, _ c: NWConnection) {
        c.receive(minimumIncompleteLength: 1, maximumLength: 1 << 16) { [weak self] data, _, done, err in
            guard let self = self else { return }
            if let d = data, !d.isEmpty {
                var b = (self.bufs[id] ?? Data()) + d
                while let nl = b.firstIndex(of: 10) {
                    let line = b.subdata(in: b.startIndex..<nl); b = b.subdata(in: (nl + 1)..<b.endIndex)
                    if let s = String(data: line, encoding: .utf8), !s.isEmpty { self.send(["type": "msg", "id": id, "data": s]) }
                }
                self.bufs[id] = b
            }
            if done || err != nil { c.cancel(); self.drop(id, err?.localizedDescription ?? ""); return }
            self.receive(id, c)
        }
    }

    private func write(_ id: Int, _ s: String) {
        guard let c = conns[id], let d = (s + "\n").data(using: .utf8) else { return }
        c.send(content: d, completion: .contentProcessed { _ in })
    }

    static func localIPs() -> [String] {
        var out: [String] = []
        var ifa: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&ifa) == 0, let first = ifa else { return out }
        defer { freeifaddrs(ifa) }
        var p: UnsafeMutablePointer<ifaddrs>? = first
        while let cur = p {
            let a = cur.pointee
            if let sa = a.ifa_addr, sa.pointee.sa_family == UInt8(AF_INET) {
                let name = String(cString: a.ifa_name)
                if name.hasPrefix("en") || name.hasPrefix("bridge") {
                    var host = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                    if getnameinfo(sa, socklen_t(sa.pointee.sa_len), &host, socklen_t(host.count), nil, 0, NI_NUMERICHOST) == 0 { out.append(String(cString: host)) }
                }
            }
            p = a.ifa_next
        }
        return out
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
