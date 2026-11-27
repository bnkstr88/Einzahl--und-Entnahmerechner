// Prüfstand: Steuer-Vereinfachung (Durchschnittseinstand) vs. exakte Anteilsführung (FIFO, jüngste zuerst, teuerste zuerst)
// Jährliche Schritte, 3 Anlageklassen, Vorabpauschale, Freibetrag, Verlustvortrag, Umschichtung mit Toleranzband.
'use strict';
const TAX = 0.26375, TF = [0.3, 0, 0]; // Aktien, Anleihen, Geldmarkt

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function normals(seed, n) { const r = mulberry32(seed), o = new Float64Array(n); for (let i = 0; i < n; i += 2) { const u = Math.max(r(), 1e-12), v = r(), m = Math.sqrt(-2 * Math.log(u)); o[i] = m * Math.cos(2 * Math.PI * v); if (i + 1 < n) o[i + 1] = m * Math.sin(2 * Math.PI * v); } return o; }

const NP = 2000, YM = 70;
const Z1 = normals(11, NP * YM), Z2 = normals(22, NP * YM), Z3 = normals(33, NP * YM);
// Renditen erzeugen (nominal, log-normal), Korrelation Aktien/Anleihen 0,1
function returns(p) {
  const R = [new Float64Array(NP * YM), new Float64Array(NP * YM), new Float64Array(NP * YM)];
  const mus = [p.re, p.rb, p.rc], sds = [p.ve, p.vb, p.vc];
  for (let k = 0; k < NP * YM; k++) {
    const z = [Z1[k], 0.1 * Z1[k] + Math.sqrt(1 - 0.01) * Z2[k], Z3[k]];
    for (let c = 0; c < 3; c++) R[c][k] = Math.exp(Math.log(1 + mus[c]) - sds[c] * sds[c] / 2 + sds[c] * z[c]) - 1;
  }
  return R;
}

// ---- Depotklasse mit Anteilen (Lots). method: avg | fifo | lifo | hifo
class Pos {
  constructor(method) { this.m = method; this.lots = []; this.P = 1; } // lot: {u, b}
  value() { let u = 0; for (const l of this.lots) u += l.u; return u * this.P; }
  units() { let u = 0; for (const l of this.lots) u += l.u; return u; }
  buy(amt) {
    if (amt <= 0) return;
    const u = amt / this.P;
    if (this.m === 'avg' && this.lots.length) { this.lots[0].u += u; this.lots[0].b += amt; }
    else this.lots.push({ u, b: amt });
  }
  order() {
    if (this.m === 'lifo') return this.lots.map((_, i) => this.lots.length - 1 - i);
    if (this.m === 'hifo') return this.lots.map((_, i) => i).sort((a, b) => this.lots[b].b / this.lots[b].u - this.lots[a].b / this.lots[a].u);
    return this.lots.map((_, i) => i);
  }
  // Gewinn bei Verkauf von amt, ohne zu verändern (dry) oder mit Ausführung
  sell(amt, dry) {
    if (amt <= 0) return 0;
    let uneed = amt / this.P, gain = 0;
    const ord = this.order();
    for (const i of ord) {
      if (uneed <= 1e-12) break;
      const l = this.lots[i], take = Math.min(uneed, l.u), frac = take / l.u;
      gain += take * this.P - l.b * frac;
      if (!dry) { l.b -= l.b * frac; l.u -= take; }
      uneed -= take;
    }
    if (!dry) this.lots = this.lots.filter(l => l.u > 1e-12);
    return gain;
  }
  grow(r) { this.P *= 1 + r; }
  addBasis(x) { // versteuerte Vorabpauschale anteilig auf alle Anteile
    const U = this.units(); if (U <= 0) return;
    for (const l of this.lots) l.b += x * l.u / U;
  }
}

function weightPath(p, age) {
  if (!p.tent) return p.w;
  const peakAge = p.retAge, up0 = peakAge - p.tentUp, dn1 = peakAge + p.tentDown;
  let e = p.w[0];
  if (age >= up0 && age <= peakAge) e = p.w[0] + (p.tentEq - p.w[0]) * (age - up0) / p.tentUp;
  else if (age > peakAge && age < dn1) e = p.tentEq + (p.w[0] - p.tentEq) * (age - peakAge) / p.tentDown;
  const rest = 1 - e, rb = p.w[1] / (p.w[1] + p.w[2]);
  return [e, rest * rb, rest * (1 - rb)];
}

// Verkaufsvektor: zuerst aus übergewichteten Klassen
function saleVec(pos, G, w) {
  const V = pos.map(x => x.value()), tot = V[0] + V[1] + V[2];
  const T = w.map(x => (tot - G) * x), d = V.map((v, k) => Math.max(0, v - T[k]));
  const s = d.reduce((a, b) => a + b, 0) || 1;
  return d.map(x => x * G / s);
}

function run(p, method, R) {
  const Y = p.endAge - p.age0, res = { ok: 0, tax10: [], taxAll: [], endW: [], failAge: [] };
  for (let i = 0; i < NP; i++) {
    const pos = [new Pos(method), new Pos(method), new Pos(method)];
    // Startbestand (für Szenario B): Lots aus der Vergangenheit
    if (p.initLots) p.initLots.forEach((lots, c) => lots.forEach(l => { pos[c].lots.push({ u: l.v, b: l.b }); }));
    if (method === 'avg') pos.forEach(x => { if (x.lots.length > 1) { const u = x.units(), b = x.lots.reduce((a, l) => a + l.b, 0); x.lots = [{ u, b }]; } });
    let carry = 0, pendVP = 0, defl = 1, dead = false, t10 = 0, tAll = 0;
    for (let y = 0; y < Y; y++) {
      const age = p.age0 + y, w = weightPath(p, age), k = i * YM + y;
      const retired = age >= p.retAge;
      // --- Steuer des Jahres: Vorabpauschale aus dem Vorjahr + Verkaufsgewinne in diesem Jahr
      const taxOn = (gains) => { // gains: steuerpflichtig nach Teilfreistellung
        let t = pendVP + gains - carry;
        if (t < 0) return { tax: 0, carry: -t };
        t = Math.max(0, t - p.fb); return { tax: t * TAX, carry: 0 };
      };
      let taxThis = 0;
      if (!retired) {
        // Einzahlung; Steuer auf VP wird von der Sparrate abgezogen
        const { tax, carry: c2 } = taxOn(0); carry = c2; taxThis = tax;
        const contrib = p.contrib * Math.pow(1 + p.cg, y) - tax;
        const V = pos.map(x => x.value()), tot = V.reduce((a, b) => a + b, 0) + contrib;
        // Sparrate in untergewichtete Klassen
        const need = w.map((x, c) => Math.max(0, x * tot - V[c])), sn = need.reduce((a, b) => a + b, 0) || 1;
        need.forEach((x, c) => pos[c].buy(contrib > 0 ? x * contrib / sn : 0));
        if (contrib < 0) { pos[2].sell(-contrib, false); }
      } else {
        // Netto-Entnahme, Brutto per Fixpunkt
        const net = p.net * defl;
        let G = net;
        for (let it = 0; it < 8; it++) {
          const s = saleVec(pos, G, w);
          const g = s.reduce((a, x, c) => a + pos[c].sell(x, true) * (1 - TF[c]), 0);
          G = net + taxOn(g).tax;
        }
        const tot = pos.reduce((a, x) => a + x.value(), 0);
        if (G > tot) { dead = true; res.failAge.push(age); break; }
        const s = saleVec(pos, G, w);
        const g = s.reduce((a, x, c) => a + pos[c].sell(x, false) * (1 - TF[c]), 0);
        const r = taxOn(g); carry = r.carry; taxThis = r.tax;
      }
      pendVP = 0;
      // --- Umschichtung mit Toleranzband (Steuer wird im Folgejahr fällig -> vereinfachend in pendVP mitgetragen)
      {
        const V = pos.map(x => x.value()), tot = V.reduce((a, b) => a + b, 0);
        if (tot > 0 && Math.abs(V[0] / tot - w[0]) > p.band) {
          let rg = 0;
          for (let c = 0; c < 3; c++) { const d = V[c] - w[c] * tot; if (d > 0) rg += pos[c].sell(d, false) * (1 - TF[c]); }
          for (let c = 0; c < 3; c++) { const d = w[c] * tot - V[c]; if (d > 0) pos[c].buy(d); }
          pendVP += rg; // Umschichtungsgewinn im nächsten Jahr mit verrechnet
        }
      }
      // --- Wertentwicklung + Vorabpauschale
      for (let c = 0; c < 3; c++) {
        const v0 = pos[c].value();
        pos[c].grow(R[c][k]);
        const v1 = pos[c].value();
        const vp = Math.max(0, Math.min(v0 * p.bz * 0.7, v1 - v0));
        if (vp > 0) { pos[c].addBasis(vp); pendVP += vp * (1 - TF[c]); }
      }
      if (retired) { const rt = taxThis / defl; tAll += rt; if (age < p.retAge + 10) t10 += rt; }
      defl *= 1 + p.inf;
    }
    if (!dead) res.ok++;
    res.tax10.push(t10); res.taxAll.push(tAll);
    res.endW.push(dead ? 0 : pos.reduce((a, x) => a + x.value(), 0) / defl);
  }
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  return { succ: res.ok / NP, tax10: med(res.tax10), taxAll: med(res.taxAll), endW: med(res.endW) };
}

// maximale Netto-Entnahme für Zielquote
function maxNet(p, method, R, target) {
  let lo = 0, hi = p.netHi;
  for (let it = 0; it < 12; it++) { const mid = (lo + hi) / 2; if (run({ ...p, net: mid }, method, R).succ >= target) lo = mid; else hi = mid; }
  return lo;
}

const BASE = { re: 0.06, rb: 0.0275, rc: 0.015, ve: 0.16, vb: 0.05, vc: 0.005, inf: 0.02, bz: 0.025, fb: 1000, band: 0.05, w: [0.7, 0.25, 0.05], tent: false, tentEq: 0.4, tentUp: 10, tentDown: 10 };

// Szenario A: Ansparen 36-67 (1.000 €/Monat, +2 %/Jahr), Entnahme 67-95
const A = { ...BASE, age0: 36, retAge: 67, endAge: 95, contrib: 12000, cg: 0.02, netHi: 120000 };
// Szenario B: Start mit 700.000 € mit 50 (15 Jahre angespart, Gewinne enthalten), Entnahme bis 90
function initLots(total, w, years, rs) {
  return w.map((wc, c) => { const lots = []; let S = 0; for (let k = 0; k < years; k++) S += Math.pow(1 + rs[c], years - k); const per = total * wc / S; for (let k = 0; k < years; k++) lots.push({ v: per * Math.pow(1 + rs[c], years - k), b: per }); return lots; });
}
const B = { ...BASE, age0: 50, retAge: 50, endAge: 90, contrib: 0, cg: 0, netHi: 60000, initLots: initLots(700000, BASE.w, 15, [0.07, 0.03, 0.015]) };

const methods = ['avg', 'fifo', 'lifo', 'hifo'];
const label = { avg: 'Durchschnitt', fifo: 'FIFO (Gesetz)', lifo: 'jüngste zuerst', hifo: 'teuerste zuerst' };
const scen = [
  ['A: Ansparen 36–67, Entnahme bis 95', A],
  ['A mit Anleihezelt (70→40→70 % Aktien)', { ...A, tent: true }],
  ['B: 700.000 € mit 50, Entnahme bis 90', B],
  ['B mit Anleihezelt (Start 40 % Aktien, in 10 J. auf 70 %)', { ...B, tent: true, retAge: 50, tentUp: 0.0001, initLots: initLots(700000, [0.4, 0.5, 0.1], 15, [0.07, 0.03, 0.015]) }],
];
const fmt = x => Math.round(x).toLocaleString('de-DE');
for (const [name, p] of scen) {
  const R = returns(p);
  console.log('\n=== ' + name + ' ===');
  // Referenz-Netto: was FIFO bei 85 % schafft
  const n85 = maxNet(p, 'fifo', R, 0.85);
  console.log('Referenz-Netto (FIFO 85 %): ' + fmt(n85 / 12) + ' €/Monat heutiger Kaufkraft');
  for (const m of methods) {
    const r = run({ ...p, net: n85 }, m, R);
    const m90 = maxNet(p, m, R, 0.90);
    console.log(`${label[m].padEnd(16)} Erfolg ${(r.succ * 100).toFixed(1)} % | max. Rate bei 90 %: ${fmt(m90 / 12)} €/Mon | Steuer erste 10 J.: ${fmt(r.tax10)} € | Steuer gesamt: ${fmt(r.taxAll)} € | Rest typ.: ${fmt(r.endW)} €`);
  }
}
