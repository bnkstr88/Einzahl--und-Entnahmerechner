# Baut die installierbare Web-App (PWA) aus der Beispielversion: Beispielwerte, Eingaben bleiben nur lokal auf dem Gerät
import os, re, subprocess, hashlib
subprocess.run(['python3', 'build_demo.py'], check=True)
h = open('rechner-beispiel.html').read()
def rep(a, b, n=1):
    global h
    assert h.count(a) == n, (a[:70], h.count(a)); h = h.replace(a, b)
rep('<title>Anspar- und Entnahmerechner (Beispiel)</title>', '''<title>Anspar- und Entnahmerechner</title>
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#1f5fa8">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Rechner">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" href="icon-192.png">''')
rep('<p class="demo-note">Mit erfundenen Beispielwerten. Trag deine eigenen Zahlen ein.</p>', '<p class="demo-note">Startet mit Beispielwerten. Deine Eingaben bleiben nur auf diesem Gerät gespeichert.</p>')
h = h.replace('localStorage.getItem("aer-view-demo2")', 'localStorage.getItem("aer-app-view2")').replace('localStorage.setItem("aer-view-demo2", v)', 'localStorage.setItem("aer-app-view2", v)')
# PDF: auf dem Handy über das Teilen-Menü (iOS lädt Blobs in Web-Apps nicht herunter)
rep('const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));',
    'const fileP = new File([data], filename, { type: "application/pdf" }); if (navigator.canShare && navigator.canShare({ files: [fileP] })) { try { await navigator.share({ files: [fileP], title: filename }); st.textContent = "Geteilt."; return; } catch (e) { if (e && e.name === "AbortError") { st.textContent = ""; return; } } } const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));')
# Eingaben lokal speichern und beim Start wiederherstellen
PERSIST = r'''
/* ---------- App: Eingaben auf dem Gerät speichern ---------- */
const APPKEY = "aer-app-state-v1";
function appSave() {
  try {
    const vals = {};
    document.querySelectorAll("input[id], select[id]").forEach(el => { if (/-n$/.test(el.id)) return; vals[el.id] = el.type === "checkbox" ? el.checked : el.value; });
    localStorage.setItem(APPKEY, JSON.stringify({ vals, numv: Object.assign({}, NUMV), S: Object.assign({}, S), misc: { pkvEur, pAgeWant, ptaxLinked, lateLinked } }));
  } catch (e) {}
}
function appRestore() {
  let st = null; try { st = JSON.parse(localStorage.getItem(APPKEY) || "null"); } catch (e) {}
  if (!st || !st.vals) return;
  Object.entries(st.vals).forEach(([id, v]) => { const el = $(id); if (!el) return; if (el.type === "checkbox") el.checked = !!v; else el.value = v; });
  Object.keys(NUMV).forEach(k => delete NUMV[k]); Object.assign(NUMV, st.numv || {});
  Object.assign(S, st.S || {});
  const m = st.misc || {}; if ("pkvEur" in m) pkvEur = m.pkvEur; if ("pAgeWant" in m) pAgeWant = m.pAgeWant; if ("ptaxLinked" in m) ptaxLinked = m.ptaxLinked; if ("lateLinked" in m) lateLinked = m.lateLinked;
  if (SCEN[S.scen]) { const keep = ["ve", "vb", "vg", "inf"].map(k => [k, gv(k)]); setScen(S.scen); keep.forEach(([k, x]) => setV(k, x)); } else setScen("e");
  pressed("scen", S.scen);
  Object.keys(NUMCFG).forEach(id => { try { showNum(id); } catch (e) {} });
  if ($("flows-c")) $("flows-c").hidden = !$("flowsOn").checked;
}
let appT = 0; const appLater = () => { clearTimeout(appT); appT = setTimeout(appSave, 400); };
["input", "change", "click"].forEach(t => document.addEventListener(t, appLater, true));
window.addEventListener("pagehide", appSave);
'''
rep('setScen(SCEN0); syncAll(); run();', PERSIST + 'setScen(SCEN0); appRestore(); syncAll(); run();')
# Service Worker anmelden
rep('</body>', '<script>if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js");</script>\n</body>')
os.makedirs('app', exist_ok=True)
open('app/index.html', 'w').write(h)
ver = hashlib.sha256(h.encode()).hexdigest()[:10]
open('app/sw.js', 'w').write('''// Erst aus dem Netz (neueste Version), ohne Netz aus dem Speicher
const V = "rechner-%s";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => { if (r && (r.ok || r.type === "opaque")) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined))));
});
''' % ver)
open('app/manifest.webmanifest', 'w').write('''{
  "name": "Anspar- und Entnahmerechner",
  "short_name": "Rechner",
  "description": "Ansparen und Entnehmen mit deutschen Steuern, Rente und 2.000 möglichen Zukünften",
  "lang": "de-DE",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#f2f5f9",
  "theme_color": "#1f5fa8",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
''')
print('app ok', ver)
