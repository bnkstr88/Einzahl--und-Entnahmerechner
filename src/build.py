import re
import json, os
# Persönliche Standardwerte stehen in mine.json (nicht im Repository). Fehlt die Datei: aus dem persönlichen Artefakt übernehmen.
_M = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mine.json')))
MINE_VAL, MINE_CHK, MINE_S = _M["MINE_VAL"], _M["MINE_CHK"], _M["MINE_S"]
eng = open('engine.js').read(); ui = open('ui.js').read(); h = open('part1.html').read()
for k, v in MINE_VAL.items():
    h, n = re.subn(r'(id="%s" [^>]*value=")[^"]*(")' % k, r'\g<1>%s\g<2>' % v, h); assert n == 1, k
    ui, n = re.subn(r'(const DEFAULTS = \{[^}]*?\b%s: )[0-9.]+' % k, r'\g<1>%s' % v, ui); assert n == 1, k
for k, v in MINE_CHK.items():
    ui, n = re.subn(r'(const DEFAULTS = \{[^}]*?\b%s: )(true|false)' % k, r'\g<1>%s' % ('true' if v else 'false'), ui); assert n == 1, k
    if v: h, n = re.subn(r'id="%s">' % k, 'id="%s" checked>' % k, h); assert n == 1, k
for k, v in MINE_S.items():
    ui, n = re.subn(r'((?:const S = \{|Object\.assign\(S, \{)[^}]*?\b%s: )"[a-z]+"' % k, r'\g<1>%s' % v, ui); assert n == 2, (k, n)
ui, n = re.subn(r'const SCEN0 = "o"', 'const SCEN0 = "v"', ui); assert n == 1
h, n = re.subn('Für den Anfang reichen „Wie früher“ und „Kein Test“.', 'Standard ist hier vorsichtig „Eher schwach“ ohne Test.', h); assert n == 1
i = h.rindex('<script>\n{')
open('anspar-entnahme-rechner.html', 'w').write(h[:i] + '<script type="text/plain" id="engine-src">\n' + eng + '\n</script>\n' + h[i:] + eng + ui)
print('ok')
