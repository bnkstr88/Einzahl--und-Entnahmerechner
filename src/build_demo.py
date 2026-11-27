import re
DEMO = {"inc0": 2600, "age0": 41, "cap": 65000, "gain0": 25, "contrib": 350, "net": 900, "pens": 1650, "debt": 285000, "lz": 3.4, "lrate": 1350, "lsond": 2000, "hv": 420000}
h = open('part1.html').read(); u = open('ui.js').read(); eng = open('engine.js').read()
for k, v in DEMO.items():
    h, n = re.subn(r'(id="%s" [^>]*value=")[^"]*(")' % k, r'\g<1>%s\g<2>' % v, h); assert n == 1, k
    u, n = re.subn(r'(\b%s: )[0-9.]+(,)' % k, r'\g<1>%s\g<2>' % v, u, count=1); assert n == 1, k
h = h.replace('<title>Anspar- und Entnahmerechner</title>', '<title>Anspar- und Entnahmerechner (Beispiel)</title>')
a = '    <div class="toggle viewsw three"'
assert h.count(a) == 1
h = h.replace(a, '    <p class="demo-note">Mit erfundenen Beispielwerten. Trag deine eigenen Zahlen ein.</p>\n' + a)
h = h.replace('@media (prefers-reduced-motion: reduce)', '.demo-note { margin: 10px 0 0 !important; font-size: 0.9rem; font-weight: 600; color: var(--accent) !important; }\n@media (prefers-reduced-motion: reduce)', 1)
u = u.replace('localStorage.getItem("aer-view2")', 'localStorage.getItem("aer-view-demo2")').replace('localStorage.setItem("aer-view2", v)', 'localStorage.setItem("aer-view-demo2", v)')
i = h.rindex('<script>\n{')
open('rechner-beispiel.html', 'w').write(h[:i] + '<script type="text/plain" id="engine-src">\n' + eng + '\n</script>\n' + h[i:] + eng + u)
print('ok')
