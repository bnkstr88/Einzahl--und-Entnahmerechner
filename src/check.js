// Prüft den Rechenkern: Plausibilität, Vergleich FIFO vs. Zweitdepot, Laufzeit
const fs = require('fs');
eval(fs.readFileSync(__dirname + '/engine.js', 'utf8'));
const base = { age0: 36, retAge: 67, age1: 95, cap: 0, gain0: 0, contrib: 1000, cg: 0.02, net: 1150, wmode: 'fix', indexed: true, dcut: .1, dup: .1, dfloor: .75, dcap: Infinity,
  wE: 0.7, wC: 0.05, band: 0.05, tent: false, tUp: 10, tPeak: 0.4, tDown: 10, tLate: 0.7,
  re: 0.06, rb: 0.0275, rc: 0.015, ve: 0.16, vb: 0.05, inf: 0.02, model: 's', stress: 'none', off: 0,
  rate: 0.26375, fb: 1000, bz: 0.025, trick: false };
const f = x => Math.round(x).toLocaleString('de-DE');
function show(name, p) {
  const t0 = Date.now(); const r = simulate(p, false); const ms = Date.now() - t0;
  console.log(`${name.padEnd(34)} Erfolg ${(r.success * 100).toFixed(1)} % | Vermögen mit 67 typ. ${f(r.retMed)} / schlecht ${f(r.retLow)} | Steuer Anspar ${f(r.taxAcc)} | Rente erste 10 J. ${f(r.taxRet10)} | Rente ges. ${f(r.taxRet)} | Rest ${f(r.endMed)} | brutto 1. J. ${f(r.gross1)} €/Mon | ${ms} ms`);
}
show('A einfach FIFO', base);
show('A einfach Zweitdepot', { ...base, trick: true });
show('A einfach Zelt FIFO', { ...base, tent: true });
show('A einfach Zelt Zweitdepot', { ...base, tent: true, trick: true });
show('A realistisch FIFO', { ...base, model: 'r' });
show('A realistisch Zweitdepot', { ...base, model: 'r', trick: true });
show('A realistisch Crash zum Rentenbeginn', { ...base, model: 'r', stress: 'cgfc', off: 31 });
show('  dito mit Zelt', { ...base, model: 'r', stress: 'cgfc', off: 31, tent: true });
show('A flexibel', { ...base, model: 'r', wmode: 'dyn' });
show('B 700k mit 50, Gewinn 40 %', { ...base, model: 's', age0: 50, retAge: 50, age1: 90, cap: 700000, gain0: 0.4, contrib: 0, net: 1250 });
show('B dito Zweitdepot', { ...base, model: 's', age0: 50, retAge: 50, age1: 90, cap: 700000, gain0: 0.4, contrib: 0, net: 1250, trick: true });
show('ohne Steuern (Kontrolle)', { ...base, rate: 0 });
show('Basiszins 0 (keine VP)', { ...base, bz: 0 });
// Konsistenz: ohne Steuern dürfen FIFO und Zweitdepot nicht abweichen
const a = simulate({ ...base, rate: 0 }, true), b = simulate({ ...base, rate: 0, trick: true }, true);
console.log('Kontrolle ohne Steuer gleich:', a.success === b.success && Math.abs(a.endMed - b.endMed) < 1);
// deterministisch: Vol 0, Kontrolle Vorabpauschale
const det = simulate({ ...base, ve: 0, vb: 0, model: 's', age0: 60, retAge: 61, age1: 62, contrib: 0, cap: 100000, gain0: 0, wE: 1, wC: 0, net: 0, fb: 0, bz: 0.032 }, false);
console.log('Determin. Steuer Jahr 2 (100.000 € Aktien, 6 %, BZ 3,2 %):', det.taxY[1 * 2000].toFixed(2), 'erwartet', (100000 * 0.032 * 0.7 * 0.7 * 0.26375 / 1.02).toFixed(2));
