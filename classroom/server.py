"""PC Assembly Lab: classroom server (runs on the teacher's PC, Python 3 standard library only).

   python classroom/server.py [port] [--no-browser]        (or double-click start-class.bat)

Serves the app to the students' PCs over the LAN (http://<teacher-ip>:8080) and the teacher's panel
(http://localhost:8080/teacher, this PC only). When it serves the page itself (a browser opening it, not a fetch), it
adds <script>window.CLASSROOM=true</script>, which turns on js/game/classroom.js; the live site, a file:// copy and the
offline zip never get that line, so they run as before.

  GET  /events          Server-Sent Events: the class settings (STATE), sent again whenever the teacher changes them
  POST /api/progress    a student's name and progress (every few seconds)
  GET  /api/students    the students, for the teacher's panel (this PC only)
  POST /api/state       the teacher's changes (this PC only); kept in classroom/state.json
"""
import json, os, re, socket, sys, threading, time, webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                                   # the app: index.html, js/, css/, vendor/, themes/
STATE_FILE = os.path.join(HERE, "state.json")
PORT = next((int(a) for a in sys.argv[1:] if a.isdigit()), 8080)
OPEN_PANEL = "--no-browser" not in sys.argv                   # opens the teacher's panel in the browser at start
INJECT = b"<script>window.CLASSROOM=true</script>\n"

# mode: build / trouble / install. to: build steps 1..to are open (0 = all). challenge: install scenario id ("" = free
# choice). tsCase: troubleshooting case index (-1 = free choice). goto / msg: {n|text, seq}: seq is the send time (ms),
# so each student applies it once, even after a server restart. session: a new one (the teacher's "New session") makes
# every page forget its name and progress; resets: {student id: time}, the same for one student. pause: everyone's screen shows "eyes on the teacher". skip: Ctrl+H / sidebar skips allowed.
STATE = {"mode": "build", "to": 0, "challenge": "", "tsCase": -1, "goto": {"n": 0, "seq": 0},
         "msg": {"text": "", "seq": 0}, "pause": False, "skip": False, "session": int(time.time() * 1000), "resets": {}}
KEEP = ("mode", "to", "challenge", "tsCase", "skip", "session")          # kept in state.json; goto / msg / pause are for this class only
try:
    with open(STATE_FILE, encoding="utf-8") as f: STATE.update({k: v for k, v in json.load(f).items() if k in KEEP})
except (OSError, ValueError): pass

STUDENTS = {}                                                  # id → the last progress report, plus "seen" (time)
lock = threading.Condition()
version = 0                                                    # goes up on every teacher change; /events waits on it


def lan_ips():
    ips = set()
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET): ips.add(info[4][0])
    except OSError: pass
    try:                                                       # the address the default route uses (no packet is sent)
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(("10.255.255.255", 1)); ips.add(s.getsockname()[0]); s.close()
    except OSError: pass
    return sorted(ip for ip in ips if not ip.startswith(("127.", "169.254.")))   # loopback and "no DHCP" addresses


def app_version():
    # version.js's APP_VERSION: a student page running an older copy reloads itself (an update during the class)
    try:
        with open(os.path.join(ROOT, "version.js"), encoding="utf-8") as f: m = re.search(r'APP_VERSION\s*=\s*"([^"]+)"', f.read())
        return m.group(1) if m else ""
    except OSError: return ""


class Server(ThreadingHTTPServer):
    request_queue_size = 1024                                  # a whole class reloading at once (New session); the default 5 refuses some
    daemon_threads = True
    allow_reuse_address = False                                # on Windows that would let two servers share a port


def port_busy(p):
    # another program on this port (even on 127.0.0.1 only, e.g. a local AI server) would get "localhost" instead of us
    try:
        with socket.create_connection(("127.0.0.1", p), timeout=0.3): return True
    except OSError: return False


def open_server():
    global PORT
    for p in range(PORT, PORT + 30):
        if port_busy(p): continue
        try: srv = Server(("0.0.0.0", p), Handler)
        except OSError: continue
        if p != PORT: print(f"  Port {PORT} is taken by another program: using {p}.\n")
        PORT = p; return srv
    sys.exit(f"No free port between {PORT} and {PORT + 29}.")


class Handler(SimpleHTTPRequestHandler):
    # Windows can map .js to text/plain through the registry: set the types the app uses
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".css": "text/css",
                      ".html": "text/html", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2",
                      ".zip": "application/zip", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp"}

    # keep-alive: a page is ~85 files, so a PC reuses a few connections instead of opening one per file
    protocol_version = "HTTP/1.1"
    timeout = 30                                               # an idle kept-alive connection closes after 30 s

    def __init__(self, *a, **kw): super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a): pass                            # quiet: 15 PCs polling would flood the window

    def local(self): return self.client_address[0] in ("127.0.0.1", "::1")

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")          # a new copy of the app shows up on the next reload
        super().end_headers()

    def send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

    def read_json(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0 or n > 65536: return None
        try: return json.loads(self.rfile.read(n))
        except ValueError: return None

    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/", "/index.html"): return self.send_page()
        if path == "/events": return self.events()
        if path in ("/teacher", "/teacher.html"):
            if not self.local(): return self.send_error(403, "Teacher's PC only")
            return self.send_file(os.path.join(HERE, "teacher.html"))
        if path == "/api/students":
            if not self.local(): return self.send_error(403)
            now = time.time()
            with lock: rows = [dict(s, online=now - s["seen"] < 15) for s in STUDENTS.values()]
            return self.send_json({"state": STATE, "students": rows, "urls": [f"http://{ip}:{PORT}" for ip in lan_ips()]})
        if path.startswith("/classroom/"): return self.send_error(404)   # state.json and the server stay private
        return super().do_GET()

    def do_POST(self):
        global version
        path = self.path.split("?")[0]
        data = self.read_json()
        if not isinstance(data, dict): return self.send_error(400)
        if path == "/api/progress":
            sid = str(data.get("id", ""))[:40]
            if not sid: return self.send_error(400)
            data["seen"] = time.time(); data["ip"] = self.client_address[0]
            with lock:                                         # a page from before a reset / new session: not listed again
                if sid not in STATE["resets"] and data.get("session") in (None, STATE["session"]): STUDENTS[sid] = data
            return self.send_json({"ok": True})
        if path == "/api/state":
            if not self.local(): return self.send_error(403)
            with lock:
                seq = int(time.time() * 1000)
                if "forget" in data: STUDENTS.pop(str(data["forget"]), None)
                if data.get("newSession"):                     # everyone types their name again and starts from step 1
                    STUDENTS.clear(); STATE.update(session=seq, resets={}, pause=False, goto={"n": 0, "seq": seq}, msg={"text": "", "seq": seq})
                if data.get("resetStudent"):
                    sid = str(data["resetStudent"]); STATE["resets"][sid] = seq; STUDENTS.pop(sid, None)
                for k in ("mode", "to", "challenge", "tsCase", "pause", "skip"):
                    if k in data: STATE[k] = data[k]
                if data.get("goto"):
                    n = int(data["goto"]); STATE["goto"] = {"n": n, "seq": seq}
                    if STATE["to"] and STATE["to"] < n: STATE["to"] = n      # the step they are sent to must be open
                if "msg" in data: STATE["msg"] = {"text": str(data["msg"])[:300], "seq": seq}
                version += 1; lock.notify_all()
                try:
                    with open(STATE_FILE, "w", encoding="utf-8") as f: json.dump({k: STATE[k] for k in KEEP}, f, ensure_ascii=False)
                except OSError: pass
            return self.send_json(STATE)
        self.send_error(404)

    def send_file(self, fn, inject=False):
        try:
            with open(fn, "rb") as f: body = f.read()
        except OSError: return self.send_error(404)
        if inject:
            i = body.find(b"<script")
            body = body[:i] + INJECT + body[i:] if i >= 0 else body + INJECT
        self.send_response(200); self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

    def send_page(self):
        # only a page the browser opens: "Download offline" fetch()es index.html, and its zip must stay a normal copy
        dest = self.headers.get("Sec-Fetch-Dest")
        self.send_file(os.path.join(ROOT, "index.html"), inject=dest in (None, "document", "iframe"))

    def events(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.close_connection = True                           # the stream has no length: it ends when the connection does
        self.end_headers()
        seen = -1
        try:
            while True:
                with lock:
                    if seen == version: lock.wait(timeout=15)
                    changed = seen != version; seen = version; msg = json.dumps(dict(STATE, app=app_version()), ensure_ascii=False)
                # a comment every 15 s keeps the connection open and finds the closed ones
                self.wfile.write(f"data: {msg}\n\n".encode() if changed else b": ping\n\n"); self.wfile.flush()
        except (OSError, ValueError): pass                     # the student closed the page


if __name__ == "__main__":
    print("PC Assembly Lab - classroom server\n")
    srv = open_server()
    print("  Students open:   " + ("   or   ".join(f"http://{ip}:{PORT}" for ip in lan_ips()) or f"http://<this PC's IP>:{PORT}"))
    print(f"  Teacher's panel: http://localhost:{PORT}/teacher\n")
    print("  Windows asks to allow Python through the firewall the first time: allow it on Private networks.")
    print("  Close this window to stop the class.\n")
    if OPEN_PANEL: threading.Timer(1, lambda: webbrowser.open(f"http://localhost:{PORT}/teacher")).start()
    try: srv.serve_forever()
    except KeyboardInterrupt: pass
