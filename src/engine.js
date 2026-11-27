/* ===================== RECHENKERN ===================== */
const NMAX = 2000, YMAX = 83, LMAX = YMAX + 2;
let N = NMAX; // Zahl der gerechneten Zukünfte; die ersten n Pfade sind immer dieselben, kleinere n sind eine Vorschau
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function normals(seed, n) {
  const r = mulberry32(seed), out = new Float64Array(n);
  for (let i = 0; i < n; i += 2) {
    const u = Math.max(r(), 1e-12), v = r(), m = Math.sqrt(-2 * Math.log(u));
    out[i] = m * Math.cos(2 * Math.PI * v);
    if (i + 1 < n) out[i + 1] = m * Math.sin(2 * Math.PI * v);
  }
  return out;
}
const M = NMAX * YMAX;
const ZE = normals(20261126, M), ZB = normals(777, M), ZI = normals(4242, M), ZG = normals(31337, M), ZR = normals(5151, M);
// Student-t mit 5 Freiheitsgraden, auf Varianz 1 skaliert (häufigere Extremjahre)
const TE = (() => {
  const chi = normals(99, M * 5), out = new Float64Array(M), sc = Math.sqrt(3 / 5);
  for (let k = 0; k < M; k++) {
    let s = 0; for (let j = 0; j < 5; j++) { const z = chi[k * 5 + j]; s += z * z; }
    out[k] = ZE[k] / Math.sqrt(s / 5) * sc;
  }
  return out;
})();

// Historische Sequenzen (Prozent pro Jahr, nominal), wie im Drei-Töpfe-Rechner
const STRESS = {
  lost: { eq: [-8, -15, -32, 11, 7, 26, 6, -1.3, -37, 27.9, 19.7, -2.6, 13.0], bd: [6.86, 5.62, 9.02, 4.09, 6.70, 4.08, 0.27, 2.51, 10.14, 4.92, 4.01, 8.29, 4.64], gd: [2.4, 5.7, 5.9, 0.2, -3.8, 35.4, 10.9, 17.9, 9.0, 23.0, 39.4, 11.6, 6.1], name: "Börsenflaute wie 2000–2012" },
  infl: { eq: [-15, -26, 37, 24, -7, 7, 18, 32, -5, 21], inf: [8.7, 12.3, 6.9, 4.9, 6.7, 9.0, 13.3, 12.5, 8.9, 3.8], gd: [73.0, 66.1, -24.8, -4.1, 22.6, 37.0, 126.5, 15.2, -32.6, 14.9], name: "Hohe Inflation wie 1973–1982" },
  c87: { eq: [-23.7, 14.5, 14.5], bd: [6.81, 4.66, 1.89], gd: [1.5, -4.6, -7.3], name: "Schwarzer Montag 1987" },
  cdot: { eq: [-51.4, 15.5, 15.5, 15.5, 15.5, 15.5], bd: [23.0, 4.09, 6.70, 4.08, 0.27, 2.51], gd: [14.6, 0.2, -3.8, 35.4, 10.9, 17.9], name: "Dotcom-Blase 2000–2002" },
  cgfc: { eq: [-59.1, 19.6, 19.6, 19.6, 19.6, 19.6], bd: [10.14, 4.92, 4.01, 8.29, 4.64, -0.49], gd: [9.0, 23.0, 39.4, 11.6, 6.1, -30.5], name: "Finanzkrise 2007–2009" },
  ccov: { eq: [-34.2, 52.0], gd: [13.8, 3.8], name: "Corona-Crash 2020" },
  gfall: { eq: [], gd: [-22.4, 21.1, -4.1, -6.8, -17.1], name: "Goldabsturz wie 1981–1985" },
  c22: { eq: [-27.1, 37.2], inf: [6.9, 5.9], bd: [-17.17, 7.19], gd: [6.6, 10.4], bdMix: true, name: "Zinsanstieg 2022" },
};

const IDX = new Float64Array(YMAX + 1), CX = new Float64Array(YMAX + 1), PXT = new Float64Array(YMAX + 1);
const RE = new Float64Array(YMAX), RB = new Float64Array(YMAX), RC = new Float64Array(YMAX), RG = new Float64Array(YMAX), IN = new Float64Array(YMAX);
// Zinspfad: Abweichung des langfristigen Zinses vom Durchschnitt am Ende jedes Jahres (DEV) und Basiszins des Jahres (BZY)
const DEV = new Float64Array(YMAX), BZY = new Float64Array(YMAX);
const RHO_R = 0.85, SIG_R = 0.005;   // Realzins-Schocks: bleiben einige Jahre, Schwankung etwa 1 Prozentpunkt
function genPath(p, i, Y) {
  const off = p.off || 0, m = p.inf, st = STRESS[p.stress];
  const dur = Math.min(6, Math.max(0.5, 2.5 * p.vb / 0.04)); // Zinsempfindlichkeit wächst mit der Schwankung (Laufzeit)
  // Langfristiger Zins = Durchschnitt + halbe Inflationsabweichung + Realzins-Schock u. Anleihen: Kupon aus dem Zins des Vorjahrs,
  // Kurs fällt mit Laufzeit × Zinsanstieg; für die Inflation entspricht das genau der bisherigen Rechnung (2 × dur × 0,5)
  const linkedAll = p.model === "r", Du = 2 * dur, bzE = Math.max(0, p.bz + m - 0.02);
  const sdDu = SIG_R * Math.sqrt(2 / (1 + RHO_R)), resid = linkedAll ? Math.sqrt(Math.max(0, Math.pow(0.85 * p.vb, 2) - Math.pow(Du * sdDu, 2) - SIG_R * SIG_R / (1 - RHO_R * RHO_R))) : p.vb;
  let prev = m, u = 0, devPrev = 0;
  for (let y = 0; y < Y; y++) {
    const k = i * YMAX + y, ys = y - off;
    const expInf = m + 0.7 * (prev - m);
    let inf;
    if (st && st.inf && ys >= 0 && ys < st.inf.length) inf = st.inf[ys] / 100;
    else if (p.model === "r") inf = Math.max(-0.01, expInf + 0.0107 * ZI[k]);
    else inf = m;
    const surprise = (p.model === "r" || (st && st.inf)) ? inf - expInf : 0;
    let re;
    if (st && ys >= 0 && ys < st.eq.length) re = st.eq[ys] / 100;
    else if (p.model === "r") re = p.re + p.ve * p.ve / 2 + p.ve * TE[k] - 1.5 * surprise;
    else re = p.re + p.ve * p.ve / 2 + p.ve * ZE[k];
    const linked = p.model === "r" || (st && st.inf);
    const uPrev = u; if (linkedAll) u = RHO_R * u + SIG_R * ZR[k];
    let dev = (linked ? 0.5 * (inf - m) : 0) + u;
    if (bzE + dev < -0.005) { u += -0.005 - bzE - dev; dev = -0.005 - bzE; }   // Zins nicht unter −0,5 %
    BZY[y] = Math.max(0, bzE + devPrev); DEV[y] = dev;
    RB[y] = p.rb + (linked ? devPrev - Du * (dev - devPrev) : 0) + resid * ZB[k];
    RC[y] = Math.max(-0.005, p.rc + (linked ? 0.8 * (prev - m) + uPrev : 0));
    re -= linkedAll ? 2 * (u - uPrev) : 0;   // steigende Realzinsen drücken auch Aktien etwas
    RE[y] = Math.max(-0.95, re);
    const eqShock = RE[y] - (p.re + p.ve * p.ve / 2);
    RB[y] += 0.4 * (p.model === "r" || st ? 0.15 * eqShock : 0);
    if (st && st.bd && ys >= 0 && ys < st.bd.length) RB[y] = st.bd[ys] / 100 + (st.bdMix ? 0 : 0.4 * (0.0075 + 0.15 * Math.min(0, eqShock)));
    RB[y] = Math.max(-0.6, RB[y]);
    // Gold: eigene Schwankung, unabhängig von Aktien; im realistischen Modell steigt es bei Inflationsüberraschungen etwas
    if (st && st.gd && ys >= 0 && ys < st.gd.length) RG[y] = st.gd[ys] / 100;
    else RG[y] = Math.max(-0.8, p.rgo + p.vg * p.vg / 2 + p.vg * ZG[k] + (p.model === "r" ? 1.0 * surprise : 0));
    // Renditen gelten bei 2 % Inflation: Zinsen, Geldmarkt und Gold folgen dem Durchschnitt voll, Aktien zu drei Vierteln
    const sh = m - 0.02;
    if (!(st && ys >= 0 && ys < st.eq.length)) RE[y] += 0.75 * sh;
    if (!(st && st.bd && ys >= 0 && ys < st.bd.length)) RB[y] += sh;
    RC[y] += sh;
    if (!(st && st.gd && ys >= 0 && ys < st.gd.length)) RG[y] += sh;
    const tc = p.ter || 0; RE[y] -= tc; RB[y] -= tc; RC[y] -= tc; RG[y] -= tc; // laufende Kosten
    IN[y] = inf; prev = inf; devPrev = dev;
  }
}

// Zielaufteilung je Alter: [Aktien, Anleihen, Geldmarkt]; das Zelt verschiebt nur zwischen Aktien und Anleihen
function weightsAt(p, age) {
  let e = p.wE;
  if (p.tent) {
    const r = p.retAge, a0 = r - p.tUp, a1 = r + p.tDown;
    if (age >= r) e = age >= a1 ? p.tLate : (p.tDown > 0 ? p.tPeak + (p.tLate - p.tPeak) * (age - r) / p.tDown : p.tLate);
    else if (age >= a0) e = p.tUp > 0 ? p.wE + (p.tPeak - p.wE) * (age - a0) / p.tUp : p.tPeak;
  }
  const fix = p.wC + p.wG;
  e = Math.max(0, Math.min(e, 1 - fix));
  return [e, Math.max(0, 1 - e - fix), p.wC, p.wG];
}

const TF = [0.3, 0, 0, 1]; // Gold-ETC mit Lieferanspruch: nach einem Jahr steuerfrei, keine Vorabpauschale
const NC = 4;
const LU = [0, 1, 2, 3].map(() => new Float64Array(LMAX));
const LB = [0, 1, 2, 3].map(() => new Float64Array(LMAX));

// Tilgungsplan: monatliche Rate, Sondertilgung am Jahresende; liefert Zahlungen je Jahr und Restschuld zu Jahresbeginn (nominal)
// DV (optional): Zinsabweichung des Pfads; dann gilt bei jeder Anschlussfinanzierung (alle 10 Jahre nach der Zinsbindung) der Zins des Pfads
function loanPlan(p, Y, saleY, DV) {
  const LP = new Float64Array(Y), DEBT = new Float64Array(Y + 1), XP = new Float64Array(Y);
  let d = p.home || p.loanOnly ? p.debt : 0, payoff = d > 0 ? null : 0; DEBT[0] = d;
  // Nach der Zinsbindung gilt der Anschlusszins (bei 2 % Inflation; bei mehr Inflation entsprechend höher). Die Rate bleibt gleich,
  // reicht sie nicht für Zins plus 1 % Tilgung, steigt sie darauf
  const zb = p.lzb == null ? Infinity : p.lzb, z2 = p.lz2 == null ? p.lz : Math.max(0, p.lz2 + (p.inf == null ? 0.02 : p.inf) - 0.02);
  let rate = p.lrate, zc = z2;
  for (let y = 0; y < Y; y++) {
    if (y >= saleY) { d = 0; DEBT[y + 1] = 0; continue; }
    if (y >= zb && (y - zb) % 10 === 0 && d > 0) { zc = DV ? Math.max(0.005, z2 + (y > 0 ? DV[y - 1] : 0)) : z2; rate = Math.max(p.lrate, d * (zc + 0.01) / 12); }
    const zi = y < zb ? p.lz : zc;
    let paid = 0;
    for (let mo = 0; mo < 12 && d > 1e-6; mo++) {
      const pm = Math.min(d * (1 + zi / 12), rate); d = d * (1 + zi / 12) - pm; paid += pm; XP[y] += Math.max(0, pm - p.lrate);
      if (d <= 1e-6 && payoff == null) payoff = y + (mo + 1) / 12;
    }
    if (d > 1e-6 && p.lsond > 0) { const sd = Math.min(d, p.lsond); d -= sd; paid += sd; if (d <= 1e-6 && payoff == null) payoff = y + 1; }
    if (d < 1e-6) d = 0;
    LP[y] = paid; DEBT[y + 1] = d;
  }
  return { LP, DEBT, payoff, XP, rate2: rate };
}

// Gesetzliche Rente: Brutto laut Renteninformation (heutige Werte), steigt jährlich um pg; netto nach Kranken-/Pflegeversicherung
// und Steuer auf den Besteuerungsanteil (nach Jahr des Rentenbeginns; der steuerfreie Teil bleibt als fester Betrag)
// Einkommensteuer nach § 32a EStG, Grundtarif 2026
function est2026(x) {
  x = Math.floor(x);
  if (x <= 12348) return 0;
  if (x <= 17799) { const y = (x - 12348) / 1e4; return (914.51 * y + 1400) * y; }
  if (x <= 69878) { const z = (x - 17799) / 1e4; return (173.10 * z + 2397) * z + 1034.87; }
  if (x <= 277825) return 0.42 * x - 11135.63;
  return 0.45 * x - 19470.38;
}
// IN (optional): Inflation des Pfads. Rente, PKV-Beitrag und Steuertarif folgen ihr mit einem Jahr Verzögerung
// (Rentenanpassung nach den Löhnen des Vorjahrs); pg, pkvg und tg gelten bei durchschnittlicher Inflation
function pensionPlan(p, Y, IN, out) {
  const PN = out || new Float64Array(Y);
  PXT.fill(0);
  if (!p.pOn || !(p.pens > 0)) { if (out) PN.fill(0); return { PN, PY: Infinity }; }
  // pg, pkvg und tg gelten bei 2 % Inflation; höhere oder niedrigere Inflation geht mit einem Jahr Verzögerung durch
  const m = p.inf == null ? 0.02 : p.inf, X = IDX;
  X[0] = 1; for (let y = 1; y < Y; y++) X[y] = X[y - 1] * (1 + (IN && y >= 2 ? IN[y - 2] : m)) / 1.02;
  const PY = Math.max(0, p.pAge - p.age0), year = (p.year0 || 2026) + PY;
  const BA = year >= 2058 ? 1 : year >= 2023 ? (83 + 0.5 * (year - 2024)) / 100 : 0.8;
  // Rentenniveau bei Rentenbeginn: die Renteninformation rechnet mit heute 48 %; ein niedrigeres Niveau senkt die Rente im Verhältnis
  const niv = p.pniv > 0 ? p.pniv / 0.48 : 1;
  const G0 = p.pens * 12 * niv * Math.pow(1 + p.pg, PY) * X[Math.min(PY, Y - 1)], free = (1 - BA) * G0;
  let first = null;
  if (out) PN.fill(0, 0, Math.min(PY, Y));
  for (let y = PY; y < Y; y++) {
    const G = p.pens * 12 * niv * Math.pow(1 + p.pg, y) * X[y];
    // Privat versichert: heutiger Gesamtbeitrag ohne Krankentagegeld und ohne den 10-%-Zuschlag (entfällt ab 60), wächst um pkvg,
    // minus Beitragsentlastung; die Rentenversicherung zahlt 8,75 % der Bruttorente dazu, höchstens die Hälfte des Beitrags
    let kv, prem = 0, zus = 0;
    if (p.kvPriv) { prem = Math.max(0, (p.pkv0 - p.ktg) * (10 / 11) * Math.pow(1 + p.pkvg, y) * X[y] - p.bel) * 12; zus = Math.min(0.0875 * G, prem / 2); kv = prem - zus; }
    else kv = p.pkv * G;
    const base = Math.max(0, G - free - kv);
    let tx, f = 1;
    if (p.ptaxAuto) {
      // Tarif des jeweiligen Jahres: alle Grenzen wachsen ab 2026 um tg pro Jahr; Pauschalen 102 € + 36 € bleiben fest
      f = Math.pow(1 + p.tg, Math.max(0, (p.year0 || 2026) + y - 2026)) * X[y];
      tx = f * est2026(Math.max(0, base - 138) / f) * (1 + (p.kst || 0));
    } else tx = p.ptax * base;
    PXT[y] = Math.max(0, base - 138);
    PN[y] = (G - kv - tx) / 12;
    if (first == null) first = { gross: G / 12, kv: kv / 12, tax: tx / 12, net: PN[y], rate: base > 0 ? tx / base : 0, gfb: 12348 * f, prem: prem / 12, zus: zus / 12 };
  }
  return { PN, PY, BA, first, year };
}


// ---------- Vermietete Immobilie ----------
// Kredit wie beim eigenen Haus (Zinsbindung, Anschlusszins), ohne Sondertilgung
function rentalLoan(p, Y, rsY, DV) {
  return loanPlan({ loanOnly: true, home: false, debt: p.rdebt || 0, lz: p.rlz || 0, lzb: p.rlzb, lz2: p.rlz2, lrate: p.rrate || 0, lsond: 0, inf: p.inf }, Y, rsY, DV);
}
// Netto-Zufluss pro Jahr (nominal) nach Kosten, Rate und Steuer; im Verkaufsjahr inkl. Erlös.
// X: Index der Inflation (1 bei 2 %), D: Deflator des Pfads, XT: zu versteuerndes Renteneinkommen, RY: Beginn der Entnahme
function rentalFlows(p, Y, L, rsY, X, D, XT, RY, out) {
  const CF = out || new Float64Array(Y), det = { first: null, after: null };
  CF.fill(0);
  if (!p.rOn) return det;
  const y0 = p.year0 || 2026, basis = (p.rbuy || 0) * (p.rbldg == null ? 0.75 : p.rbldg), afaR = p.rafa || 0;
  const yrs0 = y0 - (p.rbuyY || y0), afaN = afaR > 0 ? 1 / afaR : 0;
  let afaCum = Math.min(basis, Math.max(0, yrs0) * basis * afaR);
  // Nicht umlagefähige Kosten pro Jahr (heute): Hausgeld der WEG plus eigene Instandhaltung nach Fläche; alte Eingabe in % der Miete bleibt lesbar
  const costR0 = p.rkost != null ? 12 * p.rkost : p.rhgm != null || p.rih != null ? 12 * (p.rhgm || 0) + (p.rqm || 0) * (p.rih || 0) : 12 * (p.rrent || 0) * (p.rcost || 0);
  // Abschreibung als fester Eurobetrag (aus der Anlage V), endet 50 Jahre nach dem Kauf
  const afaE = p.rafaE != null ? p.rafaE : null, afaEnd = (p.rbuyY || y0) + 50;
  for (let y = 0; y < Y; y++) {
    if (y > rsY) break;
    const g = Math.pow(1 + (p.rmg == null ? 0.02 : p.rmg), y) * X[y];
    const rent = y < rsY ? 12 * p.rrent * (1 - (p.rvac || 0)) * g : 0, cost = y < rsY ? costR0 * Math.pow(1.02, y) * X[y] : 0;   // Kosten steigen mit der Inflation
    const pay = L.LP[y], interest = y < rsY ? Math.max(0, pay - (L.DEBT[y] - L.DEBT[y + 1])) : 0;
    const afa = afaE != null ? (y < rsY && y0 + y < afaEnd ? afaE : 0) : y < rsY && afaCum < basis && yrs0 + y < afaN ? Math.min(basis * afaR, basis - afaCum) : 0; afaCum += afa;
    let vv = rent - cost - interest - afa, cash = rent - cost - pay;
    if (y === rsY) {
      const price = (p.rv || 0) * Math.pow(1 + (p.rhg || 0), y) * D[y] * (1 - (p.rsc == null ? 0.05 : p.rsc));
      cash += price - L.DEBT[y];
      if (y0 + y - (p.rbuyY || y0) < 10) vv += price - ((p.rbuy || 0) - afaCum);   // innerhalb der Spekulationsfrist
    }
    let tax;
    if (y < RY) tax = (p.rtax == null ? 0.35 : p.rtax) * vv;
    else {
      const f = Math.pow(1 + (p.tg || 0), Math.max(0, y0 + y - 2026)) * X[y], x = XT[y];
      tax = f * (est2026(Math.max(0, x + vv) / f) - est2026(x / f)) * (1 + (p.kst || 0));
    }
    CF[y] = cash - tax;
    if (y === 0) det.first = { rent: rent / 12, cost: cost / 12, interest: interest / 12, afa: afa / 12, pay: pay / 12, tax: tax / 12, cf: CF[0] / 12 };
    if (det.after == null && y < rsY && L.DEBT[y] <= 0 && pay === 0) det.after = { y, rent: rent / 12, cost: cost / 12, tax: tax / 12, cf: CF[y] / 12 / D[y] };
  }
  return det;
}

function simulate(p, lite) {
  const Y = Math.max(1, p.age1 - p.age0), RY = Math.max(0, p.retAge - p.age0);
  const W = []; for (let y = 0; y < Y; y++) W.push(weightsAt(p, p.age0 + y));
  const lifo = p.trick;
  const totR = lite ? null : new Float64Array((Y + 1) * N), totN = lite ? null : new Float64Array((Y + 1) * N);
  const penR = lite ? null : new Float64Array(Y * N), rateR = lite ? null : new Float64Array(Y * N), rateN = lite ? null : new Float64Array(Y * N);
  const taxY = lite ? null : new Float64Array(Y * N);
  const taxAcc = new Float64Array(N), taxRet = new Float64Array(N), taxRet10 = new Float64Array(N), endR = new Float64Array(N), atRet = new Float64Array(N), gross1 = new Float64Array(N), gross1N = new Float64Array(N), tax1N = new Float64Array(N), taxAccN = new Float64Array(N), taxRetN = new Float64Array(N), taxRet10N = new Float64Array(N);
  let fails = 0; const failAges = [], failGaps = [];   // Alter, in dem das Depot leer ist, und dann fehlender Betrag pro Monat (heutige Kaufkraft)
  // Eigenes Haus und einmalige Zahlungen (Beträge in heutiger Kaufkraft, Kredit nominal)
  const FIN = new Float64Array(Y), FOUT = new Float64Array(Y); let saleY = Infinity;
  (p.flows || []).forEach(f => { if (f.y < 0 || f.y >= Y) return; if (f.type === "sale") { if (p.home && f.y < saleY) saleY = f.y; } else if (f.type === "in") FIN[f.y] += f.amt; else FOUT[f.y] += f.amt; });
  // Eigene Anteile: sh an Rate und Sondertilgung (Zahlungen), ho am Haus (Hauswert, Restschuld im Vermögen, Verkaufserlös)
  const sh = p.home ? (p.lshare == null ? 1 : p.lshare) : 1, ho = p.home ? (p.hshare == null ? 1 : p.hshare) : 1;
  const payAll = p.home && p.debt > 0 ? (p.lrate * 12 + p.lsond) * sh : 0;
  const LN0 = loanPlan(p, Y, saleY);   // Plan bei durchschnittlichen Zinsen (für Anzeigen)
  // Kredit je Pfad: ändert sich nur, wenn eine Anschlussfinanzierung in den Zeitraum fällt
  const pathLoan = p.model === "r" && p.home && p.debt > 0 && (p.lzb == null ? Infinity : p.lzb) < Y;
  let LN, LP, DEBT; const FREED = new Float64Array(Y);
  const setLoan = L => {
    LN = L; LP = L.LP; DEBT = L.DEBT;
    for (let y = 0; y < LP.length; y++) LP[y] *= sh;
    for (let y = 0; y < DEBT.length; y++) DEBT[y] *= ho;
    for (let y = 0; y < Y; y++) FREED[y] = y < saleY ? Math.max(0, payAll - LP[y]) * (p.fp == null ? 1 : p.fp) : 0;
  };
  setLoan(LN0);
  const HR = new Float64Array(Y + 1); for (let y = 0; y <= Y; y++) HR[y] = p.home && y <= saleY ? p.hv * ho * Math.pow(1 + p.hg, y) : 0;
  // Vermietete Immobilie: Kredit, Wert (heutige Kaufkraft) und Verkauf
  const rsY = p.rOn && p.rSaleAge > 0 && p.rSaleAge - p.age0 < Y ? Math.max(0, p.rSaleAge - p.age0) : Infinity;
  let RL = rentalLoan(p, Y, rsY); const RCF = new Float64Array(Y), RDF = new Float64Array(Y + 1);
  const pathRL = p.model === "r" && p.rOn && p.rdebt > 0 && (p.rlzb == null ? Infinity : p.rlzb) < Y;
  const RVr = new Float64Array(Y + 1); for (let y = 0; y <= Y; y++) RVr[y] = p.rOn && y < rsY ? (p.rv || 0) * Math.pow(1 + (p.rhg || 0), y) : 0;
  const RDEBT = new Float64Array(Y + 1); const setRDebt = () => { for (let y = 0; y <= Y; y++) RDEBT[y] = p.rOn && y < rsY ? RL.DEBT[y] : 0; }; setRDebt();
  const withHome = (p.home && (p.hv > 0 || p.debt > 0)) || (p.rOn && (p.rv > 0 || p.rdebt > 0));
  const netR = lite || !withHome ? null : new Float64Array((Y + 1) * N), netN = lite || !withHome ? null : new Float64Array((Y + 1) * N);
  const infM = p.inf == null ? 0.02 : p.inf, bzE = Math.max(0, p.bz + infM - 0.02);
  const PL = pensionPlan(p, Y), PNP = new Float64Array(Y), pathPN = PL.PY < Y, PI = new Float64Array(Y);
  let PN = PL.PN;
  const tax1 = new Float64Array(N), loan1 = LP[Math.min(RY, Y - 1)] / 12;
  const P = new Float64Array(NC), TU = new Float64Array(NC), HEAD = new Int32Array(NC);
  let last = 0, carry = 0;

  const val = c => TU[c] * P[c];
  const total = () => val(0) + val(1) + val(2) + val(3);
  function buy(c, amt, y) { if (amt <= 0) return; const u = amt / P[c]; LU[c][y + 1] += u; LB[c][y + 1] += amt; TU[c] += u; if (y + 1 > last) last = y + 1; }
  function sell(c, amt, dry) {
    if (amt <= 0 || TU[c] <= 0) return 0;
    let need = Math.min(amt / P[c], TU[c]), gain = 0, taken = 0;
    const lu = LU[c], lb = LB[c];
    for (let s = lifo ? 0 : HEAD[c]; s <= last && need > 1e-12; s++) {
      const j = lifo ? last - s : s, u = lu[j];
      if (u <= 1e-12) continue;
      const take = Math.min(need, u), f = take / u, b = lb[j] * f;
      gain += take * P[c] - b;
      if (!dry) { lu[j] = u - take; lb[j] -= b; }
      need -= take; taken += take;
    }
    if (!dry) { TU[c] = Math.max(0, TU[c] - taken); if (!lifo) { let h = HEAD[c]; while (h < last && lu[h] <= 1e-12) h++; HEAD[c] = h; } }
    return gain;
  }
  function addBasis(c, x) { const lu = LU[c], lb = LB[c], tu = TU[c]; if (tu <= 0) return; const k = x / tu; for (let j = lifo ? 0 : HEAD[c]; j <= last; j++) if (lu[j] > 0) lb[j] += k * lu[j]; }
  const taxOf = pool => { const e = pool - carry; return e <= 0 ? 0 : p.rate * Math.max(0, e - p.fb); };
  // Verkauf in Höhe G, zuerst aus übergewichteten Klassen
  const SV = new Float64Array(NC);
  function saleVec(G, w) {
    const t = total() - G; let s = 0;
    for (let c = 0; c < NC; c++) { SV[c] = Math.max(0, val(c) - w[c] * t); s += SV[c]; }
    s = s || 1; for (let c = 0; c < NC; c++) SV[c] = SV[c] * G / s;
  }
  const gainsFor = (G, w, dry) => { saleVec(G, w); let g = 0; for (let c = 0; c < NC; c++) g += sell(c, SV[c], dry) * (1 - TF[c]); return g; };
  const DV = new Float64Array(NC), VS = new Float64Array(NC);
  function invest(amt, w, y) {
    if (amt <= 0) return;
    const t = total() + amt; let s = 0;
    for (let c = 0; c < NC; c++) { DV[c] = Math.max(0, w[c] * t - val(c)); s += DV[c]; }
    for (let c = 0; c < NC; c++) buy(c, s > 0 ? DV[c] * amt / s : w[c] * amt, y);
  }

  for (let i = 0; i < N; i++) {
    genPath(p, i, Y);
    if (pathLoan) setLoan(loanPlan(p, Y, saleY, DEV));
    if (pathRL) { RL = rentalLoan(p, Y, rsY, DEV); setRDebt(); }
    if (pathPN) PN = pensionPlan(p, Y, IN, PNP).PN;
    CX[0] = 1; for (let y = 1; y < Y; y++) CX[y] = CX[y - 1] * (1 + (y >= 2 ? IN[y - 2] : infM)) / 1.02; // Sparrate folgt den Löhnen
    if (p.rOn) { RDF[0] = 1; for (let y = 0; y < Y; y++) RDF[y + 1] = RDF[y] * (1 + IN[y]); rentalFlows(p, Y, RL, rsY, CX, RDF, PXT, RY, RCF); }
    for (let y = 0; y < Y; y++) PI[y] = PN[y] + (p.rOn && y >= RY ? RCF[y] / 12 : 0);   // Einkommen neben dem Depot: Rente plus Mietüberschuss
    for (let c = 0; c < NC; c++) { LU[c].fill(0); LB[c].fill(0); P[c] = 1; TU[c] = 0; HEAD[c] = 0; }
    last = 0; carry = 0;
    if (p.cap > 0) {
      const w = W[0];
      for (let c = 0; c < NC; c++) { const a = p.cap * w[c]; LU[c][0] = a; LB[c][0] = a * (1 - p.gain0); TU[c] = a; }
    }
    let vpPend = 0, defl = 1, dead = false, tA = 0, tR = 0, tR10 = 0, tAN = 0, tRN = 0, tR10N = 0;
    const st = { base: 0, iwr: 0 };
    if (!lite) { totR[i] = p.cap; totN[i] = p.cap; if (netR) { netR[i] = p.cap + HR[0] + RVr[0] - DEBT[0] - RDEBT[0]; netN[i] = netR[i]; } }
    for (let y = 0; y < Y; y++) {
      const age = p.age0 + y, w = W[y], retired = y >= RY;
      if (retired && y === RY) { st.base = p.net * defl; const t = total(); st.iwr = t > 0 ? Math.max(0, st.base - PI[y]) * 12 / t : 0; }
      let cashIn = (retired ? 0 : p.contrib * 12 * Math.pow(1 + p.cg, y) * CX[y] + FREED[y] - LN.XP[y] * sh + (p.rOn ? RCF[y] : 0)) + FIN[y] * defl;
      let cashNeed = (retired ? LP[y] : 0) + FOUT[y] * defl;
      // Liegt die Netto-Rente über dem Wunsch, ist die ganze Rente Einkommen; das Depot zahlt dann nichts
      // Extra für die aktiven Jahre (heutige Kaufkraft, bis zum gewählten Alter) kommt zur Rate dazu
      const EXn = retired && p.extra > 0 && age < (p.xAge || 0) ? p.extra * (p.indexed ? defl : 1) : 0;
      if (retired) cashNeed += Math.max(0, st.base + EXn - PI[y]) * 12;
      else if (PN[y] > 0) cashIn += PN[y] * 12;
      if (y === saleY) { const pr = HR[y] * defl * (1 - (p.sc || 0)) - DEBT[y]; if (pr >= 0) cashIn += pr; else cashNeed -= pr; }
      let g = 0, tax = taxOf(vpPend), G = 0;
      if (cashIn - tax < cashNeed) {
        G = cashNeed - cashIn + tax;
        for (let it = 0; it < 6; it++) { const G2 = cashNeed - cashIn + taxOf(vpPend + gainsFor(G, w, true)); const dG = Math.abs(G2 - G); G = G2; if (dG < 0.05) break; }
        const tv = total();
        if (G > tv + 1e-6) {
          dead = true; fails++; failAges.push(age); failGaps.push(Math.max(0, st.base + EXn - PI[y]) / defl);
          if (!lite) { const part = Math.max(PI[y], Math.min(st.base + EXn, PI[y] + Math.max(0, tv + cashIn - tax) / 12)); rateN[y * N + i] = part; rateR[y * N + i] = part / defl; penR[y * N + i] = PN[y] / defl; }
          let dd = defl;
          for (let yy = y; yy < Y && !lite; yy++) {
            if (yy > y) { rateN[yy * N + i] = PI[yy]; rateR[yy * N + i] = PI[yy] / dd; penR[yy * N + i] = PN[yy] / dd; }
            totR[(yy + 1) * N + i] = 0; totN[(yy + 1) * N + i] = 0; dd *= 1 + IN[yy];
            if (netR) { netR[(yy + 1) * N + i] = HR[yy + 1] + RVr[yy + 1] - (DEBT[yy + 1] + RDEBT[yy + 1]) / dd; netN[(yy + 1) * N + i] = (HR[yy + 1] + RVr[yy + 1]) * dd - DEBT[yy + 1] - RDEBT[yy + 1]; }
          }
          break;
        }
        g = gainsFor(G, w, false);
        tax = taxOf(vpPend + g);
        if (retired && y === RY) { gross1[i] = G / 12 / defl; tax1[i] = tax / 12 / defl; gross1N[i] = G / 12; tax1N[i] = tax / 12; }
      } else if (retired && y === RY) { gross1[i] = (cashNeed + tax) / 12 / defl; tax1[i] = tax / 12 / defl; gross1N[i] = (cashNeed + tax) / 12; tax1N[i] = tax / 12; }
      let pool = vpPend + g;
      invest(G + cashIn - tax - cashNeed, w, y);
      // Umschichten, wenn die Aktienquote das Toleranzband verlässt
      {
        const v0 = val(0), t = total();
        let dev = 0; for (let c = 0; c < NC; c++) if (t > 0) dev = Math.max(dev, Math.abs(val(c) / t - w[c]));
        if (t > 0 && dev > p.band + 1e-9) {
          for (let c = 0; c < NC; c++) VS[c] = val(c);
          let rg = 0, sold = 0, ds = 0;
          for (let c = 0; c < NC; c++) { const d = VS[c] - w[c] * t; if (d > 0) { rg += sell(c, d, false) * (1 - TF[c]); sold += d; } DV[c] = Math.max(0, -d); ds += DV[c]; }
          const dt = taxOf(pool + rg) - taxOf(pool); pool += rg; tax += dt;
          const proceeds = sold - dt;
          for (let c = 0; c < NC; c++) buy(c, ds > 0 ? DV[c] * proceeds / ds : 0, y);
        }
      }
      { const e = pool - carry; carry = e < 0 ? -e : 0; }
      const taxReal = tax / defl;
      if (retired) { tR += taxReal; tRN += tax; if (y < RY + 10) { tR10 += taxReal; tR10N += tax; } } else { tA += taxReal; tAN += tax; }
      if (!lite) { taxY[y * N + i] = taxReal; if (retired) { const inc = Math.max(st.base + EXn, PI[y]); rateN[y * N + i] = inc; rateR[y * N + i] = inc / defl; penR[y * N + i] = PN[y] / defl; } }
      // Wertentwicklung und Vorabpauschale
      let vpNext = 0;
      for (let c = 0; c < NC; c++) {
        const v0 = val(c); P[c] *= 1 + (c === 0 ? RE[y] : c === 1 ? RB[y] : c === 2 ? RC[y] : RG[y]); const v1 = val(c);
        if (TF[c] >= 1) continue;
        const vp = Math.max(0, Math.min(v0 * BZY[y] * 0.7, v1 - v0));
        if (vp > 0) { addBasis(c, vp); vpNext += vp * (1 - TF[c]); }
      }
      vpPend = vpNext;
      defl *= 1 + IN[y];
      const tv = total();
      if (!lite) { totN[(y + 1) * N + i] = tv; totR[(y + 1) * N + i] = tv / defl; if (netR) { netN[(y + 1) * N + i] = tv + (HR[y + 1] + RVr[y + 1]) * defl - DEBT[y + 1] - RDEBT[y + 1]; netR[(y + 1) * N + i] = netN[(y + 1) * N + i] / defl; } }
      if (y + 1 === RY) atRet[i] = tv / defl;
      // nächste Rate
      if (retired && y < Y - 1) {
        // Beginnt die gesetzliche Rente erst nach dem Start der Entnahme, bleibt die Rate in diesen Überbrückungsjahren fest;
        // die flexible Regel startet mit Rentenbeginn, bezogen auf den Teil, den dann noch das Depot zahlen muss
        const bridge = p.wmode === "dyn" && isFinite(PL.PY) && PL.PY > RY && y + 1 <= PL.PY;
        if (bridge) {
          const gI = p.indexed ? 1 + IN[y] : 1; st.base *= gI;
          if (y + 1 === PL.PY) st.iwr = tv > 0 ? Math.max(0, st.base - PI[y + 1]) * 12 / tv : 0;
        } else if (p.wmode === "dyn") {
          const prev = st.base, gI = p.indexed ? 1 + IN[y] : 1, D = p.indexed ? defl : 1;
          let nb = Math.min(Math.max(st.iwr * tv / 12 + PI[y + 1], prev * gI * (1 - p.dcut)), prev * gI * (1 + p.dup));
          st.base = Math.min(Math.max(nb, p.net * p.dfloor * D), isFinite(p.dcap) ? p.net * p.dcap * D : Infinity);
        } else if (p.indexed) st.base *= 1 + IN[y];
      }
    }
    if (RY === 0) atRet[i] = p.cap;
    if (!dead) endR[i] = total() / defl;
    taxAcc[i] = tA; taxRet[i] = tR; taxRet10[i] = tR10; taxAccN[i] = tAN; taxRetN[i] = tRN; taxRet10N[i] = tR10N;
  }
  const med = a => { const s = Float64Array.from(a).sort(); return s[Math.floor(N / 2)]; };
  const q = (a, x) => { const s = Float64Array.from(a).sort(); return s[Math.floor((N - 1) * x)]; };
  return { Y, RY, W, totR, totN, netR, netN, pension: PL, payoff: LN0.payoff, saleY, tax1: med(tax1), loan1, rateR, rateN, penR, taxY, success: 1 - fails / N, failAges, failGaps,
    taxAcc: med(taxAcc), taxRet: med(taxRet), taxRet10: med(taxRet10), endMed: med(endR), retMed: q(atRet, 0.5), retLow: q(atRet, 0.1), gross1: med(gross1), gross1N: med(gross1N), tax1N: med(tax1N), taxAccN: med(taxAccN), taxRetN: med(taxRetN), taxRet10N: med(taxRet10N) };
}

function simulateN(p, lite, n) { const o = N; N = Math.max(100, Math.min(NMAX, n || NMAX)); try { const r = simulate(p, lite); r.N = N; return r; } finally { N = o; } }
// Stellschrauben: grob mit 500 Zukünften suchen, Treffer mit allen 2.000 bestätigen (und falls nötig nachschärfen)
function leverData(p, when) {
  const offOf = o => o.retAge != null ? { off: when === "start" ? 0 : when === "pre5" ? Math.max(0, o.retAge - 5 - p.age0) : Math.max(0, o.retAge - p.age0) } : {};
  const sim = (o, n) => simulateN(Object.assign({}, p, o, offOf(o)), true, n).success;
  const GREEN = 0.8, COARSE = 500, base = sim({}, NMAX), items = [];
  if (base >= GREEN) {
    const roomy = base >= 0.995, T = [];
    if (roomy) {
      const nn = Math.round(p.net * 1.1 / 50) * 50; T.push(["net", nn, { net: nn }]);
      if (p.retAge - 2 > p.age0) T.push(["earlier", 2, { retAge: p.retAge - 2 }]);
      const cm = Math.min(100, p.contrib);
      T.push(["contribMinus", cm, p.gapLink ? { contrib: p.contrib - cm, net: Math.max(100, Math.round((p.gapLink.base + cm) * p.gapLink.pct / 100 / 50) * 50) } : { contrib: p.contrib - cm }]);
    } else {
      T.push(["contrib", 100, p.gapLink ? { contrib: p.contrib + 100, net: Math.max(100, Math.round(Math.max(0, p.gapLink.base - 100) * p.gapLink.pct / 100 / 50) * 50) } : { contrib: p.contrib + 100 }]);
      if (p.wmode === "fix") T.push(["dyn", 0, { wmode: "dyn" }]);
      if (p.retAge + 2 < p.age1) T.push(["later", 2, { retAge: p.retAge + 2, pAge: Math.max(p.pAge, p.retAge + 2) }]);
      const nn = Math.round(p.net * 0.9 / 50) * 50; T.push(["net", nn, { net: nn }]);
    }
    T.forEach(([k, v, o]) => items.push({ k, v, s: sim(o, NMAX), ok: true }));
    return { mode: roomy ? "roomy" : "green", base, items };
  }
  if (p.wmode === "fix") { const s = sim({ wmode: "dyn" }, NMAX); items.push({ k: "dyn", v: 0, s, ok: s >= GREEN }); }
  if (p.retAge > p.age0) {
    // Mit „Rentenlücke schließen“ sinkt das Ziel, wenn mehr gespart wird (weniger Konsum heute)
    const gl = p.gapLink, tgt = a => Math.max(100, Math.round(Math.max(0, gl.base - a) * gl.pct / 100 / 50) * 50);
    const at = (a, n) => sim(gl ? { contrib: p.contrib + a, net: tgt(a) } : { contrib: p.contrib + a }, n);
    let lo = 0, hi = 0, ls = base;
    for (let a = 100; a <= 6400; a *= 2) { const s = at(a, COARSE); if (s >= GREEN) { hi = a; break; } lo = a; ls = s; }
    if (hi) {
      while (hi - lo > 25) { const m = Math.round((lo + hi) / 50) * 25; if (m <= lo || m >= hi) break; if (at(m, COARSE) >= GREEN) hi = m; else lo = m; }
      let s = at(hi, NMAX), k = 0; while (s < GREEN && k++ < 6) { hi += 25; s = at(hi, NMAX); }
      items.push({ k: "contrib", v: hi, s, ok: s >= GREEN });
    } else items.push({ k: "contrib", v: 6400, s: at(6400, NMAX), ok: false });
  }
  const maxY = Math.min(10, p.age1 - p.retAge - 2);
  if (maxY >= 1) {
    const at = (n, c) => sim({ retAge: p.retAge + n, pAge: Math.max(p.pAge, p.retAge + n) }, c);
    if (at(maxY, COARSE) >= GREEN) {
      let lo = 0, hi = maxY; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (at(m, COARSE) >= GREEN) hi = m; else lo = m; }
      let s = at(hi, NMAX); while (s < GREEN && hi < maxY) { hi++; s = at(hi, NMAX); }
      items.push({ k: "later", v: hi, s, ok: s >= GREEN });
    } else items.push({ k: "later", v: maxY, s: at(maxY, NMAX), ok: false });
  }
  {
    const at = (v, c) => sim({ net: v }, c);
    let lo = 0, hi = p.net;
    while (hi - lo > 50) { const m = Math.round((lo + hi) / 100) * 50; if (m <= lo || m >= hi) break; if (at(m, COARSE) >= GREEN) lo = m; else hi = m; }
    let s = lo > 0 ? at(lo, NMAX) : base, k = 0; while (lo > 0 && s < GREEN && k++ < 6) { lo = Math.max(0, lo - 50); s = lo > 0 ? at(lo, NMAX) : base; }
    items.push({ k: "net", v: lo, s, ok: lo > 0 && s >= GREEN });
  }
  items.sort((a, b) => (b.ok - a.ok));
  return { mode: "below", base, items };
}
