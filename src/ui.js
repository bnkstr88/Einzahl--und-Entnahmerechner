
/* ===================== OBERFLÄCHE ===================== */
const $ = id => document.getElementById(id);
const nf0 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1, minimumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const eur = v => nf0.format(Math.round(v)) + " €";
const eur10 = v => nf0.format(Math.round(v / 10) * 10) + " €";
const eurR = v => { const a = Math.abs(v); if (a >= 1e6) return nf1.format(v / 1e6) + " Mio. €"; if (a >= 1e4) return nf0.format(Math.round(v / 1000) * 1000) + " €"; return nf0.format(Math.round(v / 10) * 10) + " €"; };
const axisEur = v => v >= 1e6 ? nf1.format(v / 1e6) + " Mio." : v >= 1000 ? nf0.format(v / 1000) + " T€" : nf0.format(v) + " €";
const yrs = v => v + (v == 1 ? " Jahr" : " Jahre");

const SCEN = {
  v: { re: 5, rb: 2.75, rc: 1, rg: 2.5, text: "Aktien bringen 5 % im Jahr, Anleihen 2,75 %, Geldmarkt 1 %, Gold 2,5 %. Vorsichtig gerechnet, etwa für ein schwächeres Jahrzehnt." },
  o: { re: 7, rb: 3.75, rc: 2, rg: 3.5, text: "Aktien bringen 7 % im Jahr, Anleihen 3,75 %, Geldmarkt 2 %, Gold 3,5 %, etwa wie im langjährigen Durchschnitt." },
};
const MODEL_TXT = {
  r: "Mit Extremjahren, schwankender Inflation und Anleihen, die bei Inflationsschüben mit den Aktien fallen.",
  s: "Normalverteilte Börsenjahre, feste Inflation, Anleihen unabhängig von Aktien. Freundlichere Ergebnisse.",
};
const WM_TXT = {
  fix: "Die Rate steigt jedes Jahr mit der Inflation, egal wie die Börse läuft.",
  dyn: "Läuft die Börse schlecht, entnimmst du etwas weniger, läuft sie gut, etwas mehr. Das macht den Plan sicherer.",
};
const SELL_TXT = {
  fifo: "So rechnet die Bank in einem Depot: Die ältesten Anteile mit dem meisten Gewinn gehen zuerst.",
  trick: "Vor jedem Verkauf werden die älteren Anteile in ein zweites Depot übertragen. Verkauft werden dann die jüngsten mit wenig Gewinn.",
};
const STRESS_H = {
  none: "",
  lost: "Zwei Crashs kurz hintereinander, erst nach über zehn Jahren wieder auf dem alten Stand. Anleihen wie deutsche Staatsanleihen 2000–2012.",
  c87: "Aktien fallen um 24 % und brauchen 2 Jahre bis zum alten Stand. Anleihen wie deutsche Staatsanleihen 1987–1989.",
  cdot: "Aktien fallen um 51 % und brauchen 5 Jahre bis zum alten Stand. Anleihen legten damals zusammen 23 % zu und federten ab.",
  cgfc: "Aktien fallen um 59 % und brauchen rund 5 Jahre bis zum alten Stand. Anleihen 2008 +10 %, weil Anleger in sichere Anlagen flüchteten.",
  ccov: "Aktien fallen um 34 % und sind ein Jahr später wieder auf dem alten Stand. Anleihen schwanken wie im normalen Modell.",
  c22: "Aktien fallen um 27 %, die Inflation steigt auf 6,9 %, und Anleihen fallen mit (−17 %). Danach ein Jahr bis zum alten Stand.",
  infl: "Zehn Jahre mit Inflation bis 13 %. Die Rate steigt kräftig mit, während Aktien und Anleihen real kaum zulegen. Gold stieg damals stark, 1979 allein um 127 % in US-Dollar.",
  gfall: "Gold verliert in fünf Jahren über ein Drittel, wie 1981–1985 in Euro. Aktien und Anleihen laufen zufällig weiter. Ohne Gold im Depot ändert dieser Test nichts.",
};
// Erfolgsquote ehrlich runden: das Modell ist nicht auf den Prozentpunkt genau
const succTxt = s => s >= 0.975 ? "über 95\u00a0%" : s <= 0.025 ? "unter 5\u00a0%" : "etwa " + Math.round(s * 20) * 5 + "\u00a0%";
const pInt = s => Math.round(s * 100) + "\u00a0%", p5 = s => s >= 0.975 ? "über 95\u00a0%" : s <= 0.025 ? "unter 5\u00a0%" : Math.round(s * 20) * 5 + "\u00a0%";
// Sterbetafel 2020/2022 (Destatis), Überlebende lx im Alter 30 bis 100; Sterblichkeit sinkt um 1 % pro Jahr ab 2021
const LXM = [98950,98896,98840,98780,98717,98642,98562,98472,98367,98258,98141,98012,97875,97725,97556,97374,97183,96974,96742,96483,96188,95861,95503,95108,94681,94206,93664,93068,92416,91688,90889,90001,89023,87959,86802,85543,84178,82711,81143,79469,77695,75842,73869,71820,69620,67348,64909,62408,59741,56951,54070,50964,47721,44325,40784,37110,33288,29406,25480,21710,18044,14635,11575,8834,6559,4697,3247,2143,1381,871,529];
const LXF = [99327,99301,99271,99239,99203,99162,99117,99072,99020,98961,98897,98832,98755,98674,98581,98482,98377,98258,98131,97976,97810,97628,97430,97217,96979,96709,96415,96093,95736,95341,94901,94407,93876,93296,92654,91951,91183,90352,89471,88503,87447,86312,85081,83748,82293,80745,79035,77208,75198,73021,70683,68088,65270,62157,58742,55015,50908,46504,41808,37035,32165,27294,22621,18249,14325,10899,8028,5672,3896,2565,1645];
const qOf = (L, x) => { if (x < 30) x = 30; if (x < 100) return 1 - L[x - 29] / L[x - 30]; const q99 = 1 - L[70] / L[69]; return Math.min(0.7, q99 * Math.pow(1.1, x - 99)); };
// Wahrscheinlichkeit, vom Alter a0 (im Jahr y0) das Alter A zu erleben
function survive(L, a0, A, y0) { let s = 1; for (let x = a0; x < A; x++) s *= 1 - qOf(L, x) * Math.pow(0.99, Math.max(0, y0 + (x - a0) - 2021)); return s; }
// Vermietung: fester Mietausfall; Verkauf heute: Kosten des Verkaufs
const RVAC = 0.04, RSELL = 0.05;
// Netto-Erlös, wenn die Wohnung heute verkauft wird (vor Steuer und Vorfälligkeitsentschädigung)
const rentSellNet = p => (p.rv || 0) * (1 - RSELL) - (p.rdebt || 0);
const DEFAULTS = { rOn: false, rv: 300000, rdebt: 200000, rlz: 3.5, rlzb: 10, rrate: 1000, rrent: 1100, rkost: 190, rafaE: 4200, rbuyY: 2020, rtax: 35, inc0: 3500, gapOn: false, gapPct: 100, xtra: 0, xAge: 75, pOn: false, pens: 2000, pAge: 67, pg: 2, pniv: 48, ppkv0: 700, ktg: 0, bel: 0, pkvg: 3.5, ptax: 20, tg: 2, pkv: 12.35, home: false, sc: 5, fp: 50, flowsOn: false, debt: 460000, lshare: 50, hshare: 50, lz: 2.99, lrate: 1725, lsond: 5000, hv: 640000, hg: 0, age0: 36, cap: 180000, gain0: 30, contrib: 500, cg: 0, retAge: 67, age1: 95, net: 1200, dfloor: 75, wE: 60, wC: 5, wG: 0, rg: 3.5, vg: 15, tent: false, tUp: 10, tPeak: 40, tDown: 10, tLate: 60, bz: 3.2, re: 7, rb: 3.75, rc: 2, ve: 16, vb: 4, inf: 2, idx: true, ter: 0.3, lzb: 10, lz2: 4.5 };
const S = { kvm: "gkv", ptm: "fix", wmode: "fix", swing: 10, band: 5, fb: 1000, ks: 0, sell: "fifo", scen: "o", model: "r", stress: "none", when: "ret", mode: "real" };

const fmts = {
  rv: v => eur(v), rdebt: v => eur(v), rlz: v => nf2.format(v) + " %", rlzb: v => v + " Jahre", rrate: v => eur(v), rrent: v => eur(v),
  rkost: v => eur(v), rafaE: v => eur(v), rbuyY: v => String(v), rtax: v => v + " %",
  lshare: v => v + " %", hshare: v => v + " %", inc0: v => eur(v), gapPct: v => v + " %", xtra: v => eur(v), xAge: v => v + " Jahre",
  age0: v => v + " Jahre", cap: v => eur(v), gain0: v => v + " %", contrib: v => eur(v), cg: v => nf1.format(v) + " %",
  retAge: v => "mit " + v + " Jahren", age1: v => v + " Jahre", net: v => eur(v),
  dfloor: v => eur10(gv("net") * v / 100), wE: v => v + " %", wC: v => v + " %", wG: v => v + " %", rg: v => nf2.format(v) + " %", vg: v => v + " %",
  tUp: v => v == 0 ? "zum Rentenbeginn" : yrs(v) + " vorher", tPeak: v => v + " %", tDown: v => v == 0 ? "sofort" : yrs(v), tLate: v => v + " %",
  ppkv0: v => eur(v), ktg: v => eur(v), bel: v => eur(v), pkvg: v => nf2.format(v) + " %", pniv: v => nf1.format(v) + " %", pens: v => eur(v), pAge: v => "mit " + v + " Jahren", pg: v => nf2.format(v) + " %", ptax: v => nf1.format(v) + " %", tg: v => nf2.format(v) + " %", pkv: v => nf2.format(v) + " %",
  sc: v => nf1.format(v) + " %", fp: v => v + " %", debt: v => eur(v), lz: v => nf2.format(v) + " %", lz2: v => nf2.format(v) + " %", lzb: v => v + " Jahre", lrate: v => eur(v), lsond: v => eur(v), hv: v => eur(v), hg: v => (v > 0 ? "+" : "") + nf2.format(v) + " %",
  ter: v => nf2.format(v) + " %", bz: v => nf2.format(v) + " %", re: v => nf2.format(v) + " %", rb: v => nf2.format(v) + " %", rc: v => nf2.format(v) + " %",
  ve: v => v + " %", vb: v => nf1.format(v) + " %", inf: v => nf2.format(v) + " %",
};
const ranges = Object.keys(fmts);
// Zahlenfelder neben allen Reglern: der getippte Wert gilt exakt, der Regler zeigt ihn gerundet an
const NUMCFG = {
  rv: { u: "€", d: 0, soft: 1e7 }, rdebt: { u: "€", d: 0, soft: 1e7 }, rlz: { u: "%", d: 2 }, rlzb: { u: "Jahre", d: 0 }, rrate: { u: "€", d: 0, soft: 5e4 }, rrent: { u: "€", d: 0, soft: 5e4 },
  rkost: { u: "€", d: 0, soft: 1e4 }, rafaE: { u: "€", d: 0, soft: 1e5 }, rtax: { u: "%", d: 0 }, rbuyY: { u: "", d: 0, ng: 1 },
  age0: { u: "Jahre", d: 0 }, cap: { u: "€", d: 0, soft: 2e7 }, gain0: { u: "%", d: 0 }, contrib: { u: "€", d: 0, soft: 1e5 }, cg: { u: "%", d: 1 },
  retAge: { pre: "mit", u: "Jahren", d: 0 }, age1: { u: "Jahre", d: 0 }, net: { u: "€", d: 0, soft: 5e4 }, dfloor: { u: "%", d: 0 },
  wE: { u: "%", d: 0 }, wC: { u: "%", d: 0 }, wG: { u: "%", d: 0 }, rg: { u: "%", d: 2 }, vg: { u: "%", d: 0 }, tUp: { u: "Jahre vorher", d: 0 }, tPeak: { u: "%", d: 0 }, tDown: { u: "Jahre", d: 0 }, tLate: { u: "%", d: 0 },
  lshare: { u: "%", d: 0 }, hshare: { u: "%", d: 0 }, inc0: { u: "€", d: 0, soft: 1e5 }, gapPct: { u: "%", d: 0 }, xtra: { u: "€", d: 0, soft: 2e4 }, xAge: { u: "Jahre", d: 0 },
  ppkv0: { u: "€", d: 0, soft: 1e4 }, ktg: { u: "€", d: 0, soft: 5000 }, bel: { u: "€", d: 0, soft: 5000 }, pkvg: { u: "%", d: 2 }, pniv: { u: "%", d: 1 }, pens: { u: "€", d: 0, soft: 2e4 }, pAge: { pre: "mit", u: "Jahren", d: 0 }, pg: { u: "%", d: 2 }, ptax: { u: "%", d: 1 }, tg: { u: "%", d: 2 }, pkv: { u: "%", d: 2 },
  sc: { u: "%", d: 1 }, fp: { u: "%", d: 0 }, debt: { u: "€", d: 0, soft: 5e6 }, lz: { u: "%", d: 2 }, lz2: { u: "%", d: 2 }, lzb: { u: "Jahre", d: 0 }, lrate: { u: "€", d: 0, soft: 2e4 }, lsond: { u: "€", d: 0, soft: 5e5 }, hv: { u: "€", d: 0, soft: 2e7 }, hg: { u: "%", d: 2 },
  ter: { u: "%", d: 2 }, bz: { u: "%", d: 2 }, re: { u: "%", d: 2 }, rb: { u: "%", d: 2 }, rc: { u: "%", d: 2 }, ve: { u: "%", d: 1 }, vb: { u: "%", d: 1 }, inf: { u: "%", d: 2 },
};
const NUMV = {}, ORIGMAX = {};
const isHome = () => $("home").checked;
const gv = id => NUMV[id] != null ? NUMV[id] : parseFloat($(id).value);
function setV(id, x) { const rg = $(id); rg.value = x; if (Math.abs(+rg.value - x) > 1e-9) NUMV[id] = x; else delete NUMV[id]; }
const nfd = {}; const fmtN = (id, x) => (nfd[id] || (nfd[id] = new Intl.NumberFormat("de-DE", { maximumFractionDigits: NUMCFG[id].d, useGrouping: !NUMCFG[id].ng }))).format(x);
function parseNum(s) {
  s = String(s).replace(/[^0-9,.\-]/g, "");
  if (/,/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  return parseFloat(s);
}
function showNum(id) { const el = $(id + "-n"); if (document.activeElement !== el) el.value = fmtN(id, gv(id)); }
Object.entries(NUMCFG).forEach(([id, c]) => {
  const out = $(id + "-o"), lab = document.querySelector(`label[for="${id}"]`);
  ORIGMAX[id] = +$(id).max;
  const w = document.createElement("span"); w.className = "numw";
  w.innerHTML = (c.pre ? `<span class="u">${c.pre}</span>` : "") + `<input class="num${c.u === "€" ? "" : " s"}" id="${id}-n" type="text" inputmode="decimal" autocomplete="off"><span class="u" id="${id}-u">${c.u}</span>`;
  out.replaceWith(w);
  const el = $(id + "-n");
  el.setAttribute("aria-label", (lab ? lab.textContent : id) + " in " + c.u);
});
const KS_RATE = { 0: 0.26375, 8: 1.135 / 4.08, 9: 1.145 / 4.09 };

function readParams(over) {
  const v = gv;
  const age0 = v("age0"), retAge = Math.max(v("retAge"), age0), age1 = Math.max(v("age1"), retAge + 1, age0 + 1);
  const off = S.when === "start" ? 0 : S.when === "pre5" ? Math.max(0, retAge - 5 - age0) : Math.max(0, retAge - age0);
  return Object.assign({
    age0, retAge, age1, cap: v("cap"), gain0: v("gain0") / 100, contrib: v("contrib"), cg: v("cg") / 100, net: v("net"),
    wmode: S.wmode, indexed: $("idx").checked, dcut: S.swing / 100, dup: S.swing / 100, dfloor: v("dfloor") / 100, dcap: Infinity,
    wE: v("wE") / 100, wC: v("wC") / 100, wG: v("wG") / 100, band: S.band / 100,
    tent: $("tent").checked, tUp: v("tUp"), tPeak: v("tPeak") / 100, tDown: v("tDown"), tLate: v("tLate") / 100,
    re: v("re") / 100, rb: v("rb") / 100, rc: v("rc") / 100, rgo: v("rg") / 100, vg: v("vg") / 100, ve: v("ve") / 100, vb: v("vb") / 100, inf: v("inf") / 100, ter: v("ter") / 100,
    extra: v("xtra"), xAge: v("xAge"), gapOn: $("gapOn").checked, gapLink: $("gapOn").checked && GAP ? { base: GAP.base, pct: GAP.pct } : null,
    pOn: $("pOn").checked, pens: v("pens"), pAge: Math.min(Math.max(v("pAge"), retAge), age1 - 1), pg: v("pg") / 100, pniv: v("pniv") / 100, kvPriv: S.kvm === "pkv", pkv0: v("ppkv0"), ktg: v("ktg"), bel: v("bel"), pkvg: v("pkvg") / 100, ptax: v("ptax") / 100, ptaxAuto: S.ptm === "auto", tg: v("tg") / 100, kst: S.ks / 100, pkv: v("pkv") / 100, year0: new Date().getFullYear(),
    rOn: $("rOn").checked, rv: v("rv"), rdebt: v("rdebt"), rlz: v("rlz") / 100, rlzb: v("rlzb"), rlz2: v("lz2") / 100, rrate: v("rrate"), rrent: v("rrent"), rkost: v("rkost"), rafaE: v("rafaE"), rvac: RVAC,
    rmg: 0.02, rhg: 0, rbuyY: v("rbuyY"), rtax: v("rtax") / 100, rSaleAge: 0,
    home: isHome(), debt: v("debt"), lz: v("lz") / 100, lzb: v("lzb"), lz2: v("lz2") / 100, lrate: v("lrate"), lshare: v("lshare") / 100, hshare: v("hshare") / 100, lsond: v("lsond"), fp: v("fp") / 100, sc: v("sc") / 100, hv: v("hv"), hg: v("hg") / 100,
    flows: isHome() && $("flowsOn").checked ? readFlows(age0, age1) : [],
    model: S.model, stress: S.stress, off, rate: KS_RATE[S.ks], fb: S.fb, bz: v("bz") / 100, trick: S.sell === "trick",
  }, over || {});
}

// Einmalige Zahlungen aus den drei Zeilen lesen
function readFlows(age0, age1) {
  const out = [];
  [1, 2, 3].forEach(n => {
    const t = $(`f${n}-t`).value, a = Math.round(parseNum($(`f${n}-a`).value)), v = parseNum($(`f${n}-v`).value), h = $(`f${n}-h`);
    $(`f${n}-v`).disabled = t === "sale";
    if (!t) { h.textContent = ""; return; }
    if (!isFinite(a)) { h.textContent = "Bitte ein Alter eintragen."; return; }
    if (a < age0 || a >= age1) { h.textContent = `Das Alter muss zwischen ${age0} und ${age1 - 1} liegen.`; return; }
    if (t === "sale") {
      if (!isHome()) { h.textContent = "Für einen Hausverkauf unten „Mit einbeziehen“ anhaken."; return; }
      h.textContent = `Erlös: Hauswert zu diesem Zeitpunkt abzüglich ${nf1.format(gv("sc"))} % Verkaufskosten und Restschuld.`; out.push({ type: t, age: a, y: a - age0, amt: 0, label: $(`f${n}-l`).value.trim() || "Hausverkauf" }); return;
    }
    if (!isFinite(v) || v <= 0) { h.textContent = "Bitte einen Betrag eintragen."; return; }
    h.textContent = ""; out.push({ type: t, age: a, y: a - age0, amt: v, label: $(`f${n}-l`).value.trim() || (t === "in" ? "Einnahme" : "Ausgabe") });
  });
  return out;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function pressed(attr, val) { document.querySelectorAll(`[data-${attr}]`).forEach(b => b.setAttribute("aria-pressed", String(b.dataset[attr] === String(val)))); }
const SCEN0 = "o"; // Markt-Standard beim Start und beim Zurücksetzen
function setScen(s) {
  S.scen = s; pressed("scen", s);
  if (SCEN[s]) { setV("re", SCEN[s].re); setV("rb", SCEN[s].rb); setV("rc", SCEN[s].rc); setV("rg", SCEN[s].rg); setV("ve", 16); setV("vb", 4); setV("vg", 15); setV("inf", 2); $("scen-h").textContent = SCEN[s].text; }
  else $("scen-h").textContent = `Deine eigenen Annahmen: Aktien ${fmts.re(gv("re"))}, Anleihen ${fmts.rb(gv("rb"))}, Geldmarkt ${fmts.rc(gv("rc"))}, Gold ${fmts.rg(gv("rg"))} im Jahr, Inflation ${fmts.inf(gv("inf"))}.`;
}
function matchScen() {
  const base = gv("ve") === 16 && gv("vb") === 4 && gv("vg") === 15 && gv("inf") === 2;
  const hit = base && Object.keys(SCEN).find(k => SCEN[k].re === gv("re") && SCEN[k].rb === gv("rb") && SCEN[k].rc === gv("rc") && SCEN[k].rg === gv("rg"));
  setScen(hit || "e");
}
function syncAll() {
  pressed("kvm", S.kvm); $("pkv-c").hidden = S.kvm === "pkv"; $("pkv-priv").hidden = S.kvm !== "pkv";
  pressed("ptm", S.ptm); $("tg-c").hidden = S.ptm !== "auto"; $("ptax-c").hidden = S.ptm === "auto";
  $("ptm-h").textContent = S.ptm === "auto" ? "Einkommensteuer nach dem Tarif im jeweiligen Rentenjahr, allein veranlagt, ohne weitere Einkünfte. Die Kirchensteuer aus „Steuern“ kommt dazu." : $("ptm-h").textContent;
  pressed("wmode", S.wmode); pressed("swing", S.swing); pressed("band", S.band); pressed("fb", S.fb); pressed("ks", S.ks);
  pressed("sell", S.sell); pressed("model", S.model); pressed("stress", S.stress); pressed("when", S.when);
  $("wm-h").textContent = WM_TXT[S.wmode]; $("dyn-c").hidden = S.wmode !== "dyn";
  $("sell-h").textContent = SELL_TXT[S.sell]; $("model-h").textContent = MODEL_TXT[S.model];
  $("stress-h").textContent = STRESS_H[S.stress] || "";
  updSums();
}
// Zusammenfassung je Abschnitt, sichtbar wenn zugeklappt
const SCEN_NAME = { v: "Eher schwach", o: "Wie früher", e: "Individuell" };
function updSums() {
  const g = id => gv(id), e = g("wE"), c = g("wC"), gd = g("wG"), b = Math.round((100 - e - c - gd) * 10) / 10;
  const set = (k, t) => { const el = $("sum-" + k); if (el) el.textContent = t; };
  set("ansparen", `${g("age0")} Jahre · ${eurR(g("cap"))} angelegt · ${eur(g("contrib"))} im Monat`);
  set("entnehmen", `ab ${g("retAge")} bis ${g("age1")} · ${eur(g("net"))} im Monat${gv("xtra") > 0 ? ` + ${eur(gv("xtra"))} bis ${gv("xAge")}` : ""}${$("pOn").checked ? " mit Rente" : ""} · ${S.wmode === "dyn" ? "flexibel" : "fest"}`);
  set("rente", $("pOn").checked ? `${eur(g("pens"))} brutto ab ${g("pAge")} · +${nf2.format(g("pg"))} % pro Jahr${gv("pniv") !== 48 ? ` · Niveau ${nf1.format(gv("pniv"))} %` : ""} · ${S.ptm === "auto" ? "Steuer nach Tarif" : "Steuer " + nf1.format(gv("ptax")) + " %"}${S.kvm === "pkv" ? " · privat versichert" : ""}` : "nicht einbezogen");
  set("miete", $("rOn").checked ? `Wert ${eurR(g("rv"))} · Restschuld ${eurR(g("rdebt"))} · Miete ${eur(g("rrent"))} · Rate ${eur(g("rrate"))}` : "nicht einbezogen");
  set("haus", isHome() ? `Restschuld ${eurR(g("debt"))} · ${eur(g("lrate"))} Rate · Anteil Rate ${g("lshare")} % · Hauswert ${eurR(g("hv"))}, dir gehören ${g("hshare")} %` + ($("flowsOn").checked ? " · mit Einmalzahlungen" : "") : "nicht einbezogen");
  set("aufteilung", `Aktien ${nf1.format(e)} % · Anleihen ${nf1.format(b)} % · Geldmarkt ${nf1.format(c)} %` + (gd > 0 ? ` · Gold ${nf1.format(gd)} %` : "") + ($("tent").checked ? " · Anleihezelt" : ""));
  set("fein", [gd > 0 && `Gold ${nf1.format(gd)} %`, $("tent").checked && "Anleihezelt", S.sell === "trick" && "Zweitdepot-Trick", `umschichten ${S.band ? "ab ±" + S.band + " Pkt." : "jedes Jahr"}`].filter(Boolean).join(" · "));
  set("markt", `${SCEN_NAME[S.scen]} · Aktien ${nf2.format(g("re"))} % · Kosten ${nf2.format(g("ter"))} % · Inflation ${nf2.format(g("inf"))} %` + (S.model === "s" ? " · einfaches Modell" : ""));
  set("steuern", `${S.fb === 2000 ? "2.000" : "1.000"} € Freibetrag · ${S.ks ? S.ks + " % Kirchensteuer" : "ohne Kirchensteuer"} · ${S.sell === "trick" ? "Zweitdepot-Trick" : "FIFO"} · Basiszins ${nf2.format(g("bz"))} %`);
}
// Kranken- und Pflegeversicherung: standardmäßig Prozent der Rente; ein selbst eingetragener Euro-Betrag (heutige Werte) bleibt fest
let pkvEur = null, pAgeWant = 67;
function syncPkv() {
  const pens = gv("pens");
  if (pkvEur != null) setV("pkv", pens > 0 ? Math.max(0, Math.round(pkvEur / pens * 1e4) / 100) : gv("pkv"));
  const el = $("pkvE"); if (document.activeElement !== el) el.value = nf0.format(Math.round(pkvEur != null ? pkvEur : pens * gv("pkv") / 100));
}
// Eigener Steuersatz: voreingestellt auf den Tarifwert im ersten Rentenjahr, bis man ihn selbst ändert
let ptaxLinked = true, ptaxTarif = null;
function syncPtax() {
  const pl = pensionPlan(readParams({ pOn: true, ptaxAuto: true }), 100);
  ptaxTarif = pl.first ? Math.round(pl.first.rate * 1000) / 10 : null;
  if (ptaxLinked && ptaxTarif != null) setV("ptax", ptaxTarif);
  if (S.ptm === "fix") $("ptm-h").textContent = ptaxTarif == null ? "" : ptaxLinked
    ? `Voreingestellt nach dem Steuertarif für deine Rente: ${nf1.format(ptaxTarif)} % auf den steuerpflichtigen Teil (allein veranlagt, Tarif steigt ${nf2.format(gv("tg"))} % pro Jahr). Hast du weitere Einkünfte, trag einen eigenen Satz ein.`
    : `Eigener Satz. Nach dem Steuertarif wären es für deine Rente etwa ${nf1.format(ptaxTarif)} %.`;
}
// Rentenlücke: Ziel im Alter aus dem heutigen Netto (ohne Sparrate, ohne Kreditrate wenn der Kredit vorher abbezahlt ist)
let GAP = null;
function syncGap() {
  const on = $("gapOn").checked; $("gap-c").hidden = !on;
  const p = readParams(), Y = Math.max(1, p.age1 - p.age0), RYg = Math.max(0, p.retAge - p.age0);
  const sav = RYg > 0 ? gv("contrib") : 0;
  let loan = 0, loanLate = false;
  if (p.home && p.debt > 0) { const pay = loanPlan(p, Y, Infinity).payoff; if (pay != null && pay <= RYg) loan = (p.lrate + p.lsond / 12) * p.lshare; else loanLate = true; }
  const base = Math.max(0, gv("inc0") - sav - loan), target = Math.round(base * gv("gapPct") / 100 / 50) * 50;
  GAP = { on, inc0: gv("inc0"), sav, loan, loanLate, base, pct: gv("gapPct"), target };
  if (on) setV("net", Math.max(+$("net").min, target));
  $("net").disabled = on; $("net-n").readOnly = on;
}
function syncOutputs() {
  syncPkv(); syncGap(); syncPtax();
  const a0 = gv("age0"), ra = $("retAge"), a1 = $("age1");
  ra.min = a0; if (gv("retAge") < a0) setV("retAge", a0);
  a1.min = Math.min(100, Math.max(gv("retAge") + 1, a0 + 1)); if (gv("age1") < +a1.min) setV("age1", +a1.min);
  { const pa = $("pAge"); pa.min = Math.max(60, gv("retAge")); pa.max = Math.max(+pa.min, Math.min(75, +a1.value - 1)); setV("pAge", Math.min(Math.max(pAgeWant, +pa.min), +pa.max)); showNum("pAge"); }
  const pOnNow = $("pOn").checked;
  $("net-l").textContent = pOnNow ? "Gewünschtes Netto-Einkommen im Alter" : "Entnahme pro Monat";
  $("net-h").textContent = $("gapOn").checked ? "Aus der Rentenlücke berechnet (unter „Gesetzliche Rente“). Ändern über den Anteil, den du im Alter brauchst." : pOnNow ? "Rente plus Depot zusammen, nach Steuern, in heutiger Kaufkraft." : "Nach Steuern, zusätzlich zur gesetzlichen Rente, in heutiger Kaufkraft.";
  { const xa = $("xAge"); xa.min = Math.min(100, gv("retAge") + 1); xa.max = Math.max(+xa.min, gv("age1")); if (gv("xAge") < +xa.min) setV("xAge", +xa.min); if (gv("xAge") > +xa.max) setV("xAge", +xa.max); $("xAge-c").hidden = !(gv("xtra") > 0); }
  $("wC").max = 100 - gv("wE"); if (gv("wC") > 100 - gv("wE")) setV("wC", 100 - gv("wE"));
  const gMax = 100 - gv("wE") - gv("wC"); $("wG").max = gMax; if (gv("wG") > gMax) setV("wG", gMax);
  const fixW = gv("wC") + gv("wG");
  ["tPeak", "tLate"].forEach(id => { $(id).max = 100 - fixW; if (gv(id) > 100 - fixW) setV(id, 100 - fixW); });
  ranges.forEach(showNum);
  $("dfloor-u").textContent = "% · " + fmts.dfloor(gv("dfloor"));
  const e = gv("wE"), c = gv("wC"), g = gv("wG"), b = Math.round((100 - e - c - g) * 10) / 10;
  $("mx-e").style.width = e + "%"; $("mx-b").style.width = b + "%"; $("mx-c").style.width = c + "%"; $("mx-g").style.width = g + "%";
  $("mixl").innerHTML = `<span><i class="dot" style="background:var(--eq)"></i>Aktien <b>${nf1.format(e)} %</b></span><span><i class="dot" style="background:var(--bd)"></i>Anleihen <b>${nf1.format(b)} %</b></span><span><i class="dot" style="background:var(--mm)"></i>Geldmarkt <b>${nf1.format(c)} %</b></span>` + (g > 0 ? `<span><i class="dot" style="background:var(--gd)"></i>Gold <b>${nf1.format(g)} %</b></span>` : "");
  $("gain0-c").hidden = gv("cap") === 0;
  $("tent-c").hidden = !$("tent").checked;
  $("flows-c").hidden = !$("flowsOn").checked;
  updSums();
}

/* ---------- Diagramme ---------- */
function niceStep(x) { const p = Math.pow(10, Math.floor(Math.log10(x || 1))); const f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
function pct(sorted, q) { const pos = (sorted.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos); return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo); }
function stats(arr, from, rows) {
  const out = { p10: [], p25: [], p50: [], p75: [], p90: [] }, tmp = new Float64Array(N);
  for (let y = from; y < rows; y++) {
    for (let i = 0; i < N; i++) tmp[i] = arr[y * N + i];
    tmp.sort();
    out.p10.push(pct(tmp, 0.1)); out.p25.push(pct(tmp, 0.25)); out.p50.push(pct(tmp, 0.5)); out.p75.push(pct(tmp, 0.75)); out.p90.push(pct(tmp, 0.9));
  }
  return out;
}
function frame(el, ages, ymax, fmt, opts) {
  const W = Math.max(320, Math.min(760, el.clientWidth || 640)), H = W < 500 ? 230 : 270, L = 58, R = 14, T = 16, B = 30;
  const a0 = ages[0], a1 = ages[ages.length - 1];
  const xs = a => L + (a - a0) / Math.max(1, a1 - a0) * (W - L - R);
  const step = niceStep(ymax / 4); ymax = Math.ceil(ymax / step) * step || 1;
  const ys = v => T + (1 - Math.min(v, ymax) / ymax) * (H - T - B);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${opts.label}">`;
  for (let v = 0; v <= ymax + 1e-6; v += step) s += `<line class="gridline" x1="${L}" x2="${W - R}" y1="${ys(v)}" y2="${ys(v)}"/><text class="axis" x="${L - 8}" y="${ys(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
  const span = a1 - a0, tick = span > 30 ? 10 : span > 12 ? 5 : 2;
  for (let a = Math.ceil(a0 / tick) * tick; a <= a1; a += tick) s += `<text class="axis" x="${xs(a)}" y="${H - 8}" text-anchor="middle">${a}</text>`;
  if (opts.stress) { const x1 = xs(Math.max(a0, opts.stress[0])), x2 = xs(Math.min(a1, opts.stress[1])); if (x2 > x1) s += `<rect x="${x1}" y="${T}" width="${x2 - x1}" height="${H - T - B}" fill="var(--warn)" fill-opacity="0.1"/>`; }
  if (opts.ret != null && opts.ret > a0 && opts.ret < a1 && !opts.noRet) { const x = xs(opts.ret); s += `<line class="ref" x1="${x}" x2="${x}" y1="${T}" y2="${H - B}"/><text class="reflabel" x="${x + 4}" y="${T + 10}">Entnahme ab ${opts.ret}</text>`; }
  return { W, H, L, R, T, B, xs, ys, s, ymax };
}
function drawLines(el, ages, series, opts) {
  let top = 0; (series.top || series.mid).forEach(v => { if (v > top) top = v; });
  const f = frame(el, ages, Math.max(top, opts.ref || 0) * 1.05 || 1, opts.fmt, opts);
  const { xs, ys } = f; let s = f.s;
  const path = arr => arr.map((v, k) => (k ? "L" : "M") + xs(ages[k]).toFixed(1) + " " + ys(v).toFixed(1)).join(" ");
  if (series.band) {
    const up = series.band[1].map((v, k) => `${k ? "L" : "M"}${xs(ages[k]).toFixed(1)} ${ys(v).toFixed(1)}`).join(" ");
    const dn = series.band[0].map((v, k) => [xs(ages[k]).toFixed(1), ys(v).toFixed(1)]).reverse().map(q => `L${q[0]} ${q[1]}`).join(" ");
    s += `<path class="band" d="${up} ${dn} Z"/>`;
  }
  if (opts.ref) s += `<line class="ref" x1="${f.L}" x2="${f.W - f.R}" y1="${ys(opts.ref)}" y2="${ys(opts.ref)}"/><text class="reflabel" x="${f.W - f.R}" y="${ys(opts.ref) - 6}" text-anchor="end">${opts.refLabel}</text>`;
  (opts.marks || []).forEach(mk => {
    if (mk.age < ages[0] || mk.age > ages[ages.length - 1]) return;
    const x = xs(mk.age), col = mk.type === "out" ? "var(--warn)" : "var(--good)";
    s += `<line class="mark" x1="${x}" x2="${x}" y1="${f.T}" y2="${f.H - f.B}" stroke="${col}"/><text class="reflabel" x="${x + 4}" y="${f.T + 24 + (mk.row || 0) * 12}" style="fill:${col}">${esc(mk.label)}</text>`;
  });
  if (series.area) { // Stufe beim Rentenbeginn statt schräger Rampe
    const pts = []; series.area.forEach((v, k) => { const x = xs(ages[k]); if (k && series.area[k - 1] <= 0 && v > 0) pts.push([x, ys(0)]); pts.push([x, ys(v)]); });
    s += `<path class="parea" d="${pts.map((q, k) => (k ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join(" ")} L${xs(ages[ages.length - 1]).toFixed(1)} ${ys(0).toFixed(1)} L${xs(ages[0]).toFixed(1)} ${ys(0).toFixed(1)} Z"/>`; }
  if (series.tot) s += `<path class="tot" d="${path(series.tot)}"/>`;
  if (series.high) s += `<path class="high" d="${path(series.high)}"/>`;
  if (series.low) s += `<path class="low" d="${path(series.low)}"/>`;
  s += `<path class="mid" d="${path(series.mid)}"/><line class="cursor" x1="0" x2="0" y1="${f.T}" y2="${f.H - f.B}" visibility="hidden"/>`;
  s += `<rect x="${f.L}" y="${f.T}" width="${f.W - f.L - f.R}" height="${f.H - f.T - f.B}" fill="transparent"/></svg><div class="tip" hidden></div>`;
  el.innerHTML = s;
  hover(el, ages, f, k => `<b>Mit ${ages[k]} Jahren</b>` + opts.rows.map(([name, arr]) => `<div><span>${name}</span><span>${opts.tipFmt(arr[k])}</span></div>`).join(""));
}
function hover(el, ages, f, html) {
  const svg = el.querySelector("svg"), tip = el.querySelector(".tip"), cur = el.querySelector(".cursor");
  const show = ev => {
    const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * f.W;
    const k = Math.max(0, Math.min(ages.length - 1, Math.round((x - f.L) / (f.W - f.L - f.R) * (ages.length - 1))));
    const cx = f.xs(ages[k]); cur.setAttribute("x1", cx); cur.setAttribute("x2", cx); cur.setAttribute("visibility", "visible");
    tip.innerHTML = html(k); tip.hidden = false;
    const px = cx / f.W * r.width, tw = tip.offsetWidth;
    tip.style.left = Math.min(Math.max(0, px + 12), r.width - tw) + "px"; tip.style.top = "6px";
  };
  svg.addEventListener("pointermove", show); svg.addEventListener("pointerdown", show);
  svg.addEventListener("pointerleave", () => { tip.hidden = true; cur.setAttribute("visibility", "hidden"); });
}
function drawAlloc(el, ages, Wt, opts) {
  const f = frame(el, ages, 100, v => v + " %", Object.assign({ noRet: true }, opts)); const { xs, ys } = f; let s = f.s;
  const cum = Wt.map(w => [w[2] * 100, (w[2] + w[1]) * 100, (w[2] + w[1] + w[3]) * 100, 100]); // von unten: Geldmarkt, Anleihen, Gold, Aktien
  const layer = (lo, hi, col) => {
    const up = ages.map((a, k) => `${k ? "L" : "M"}${xs(a).toFixed(1)} ${ys(hi(k)).toFixed(1)}`).join(" ");
    const dn = ages.map((a, k) => [xs(a).toFixed(1), ys(lo(k)).toFixed(1)]).reverse().map(q => `L${q[0]} ${q[1]}`).join(" ");
    return `<path d="${up} ${dn} Z" fill="var(${col})" fill-opacity="0.85"/>`;
  };
  s += layer(() => 0, k => cum[k][0], "--mm") + layer(k => cum[k][0], k => cum[k][1], "--bd") + layer(k => cum[k][1], k => cum[k][2], "--gd") + layer(k => cum[k][2], () => 100, "--eq");
  if (opts.ret != null && opts.ret > ages[0] && opts.ret < ages[ages.length - 1]) { const x = xs(opts.ret); s += `<line x1="${x}" x2="${x}" y1="${f.T}" y2="${f.H - f.B}" stroke="var(--surface)" stroke-width="1.5" stroke-dasharray="3 4"/>`; }
  s += `<line class="cursor" x1="0" x2="0" y1="${f.T}" y2="${f.H - f.B}" visibility="hidden"/><rect x="${f.L}" y="${f.T}" width="${f.W - f.L - f.R}" height="${f.H - f.T - f.B}" fill="transparent"/></svg><div class="tip" hidden></div>`;
  el.innerHTML = s;
  // Legende nur mit Klassen, die irgendwann tatsächlich Bestand haben
  const leg = $(el.id + "-leg");
  if (leg) leg.innerHTML = [[0, "--eq", "Aktien"], [1, "--bd", "Anleihen"], [3, "--gd", "Gold"], [2, "--mm", "Geldmarkt"]].filter(([i]) => Wt.some(w => w[i] > 0.0005)).map(([, c, n]) => `<span><i class="sw" style="background:var(${c})"></i>${n}</span>`).join("");
  const pc = x => Math.round(x * 100) + " %";
  hover(el, ages, f, k => `<b>Mit ${ages[k]} Jahren</b><div><span>Aktien</span><span>${pc(Wt[k][0])}</span></div><div><span>Anleihen</span><span>${pc(Wt[k][1])}</span></div><div><span>Geldmarkt</span><span>${pc(Wt[k][2])}</span></div>` + (Wt[k][3] > 0 ? `<div><span>Gold</span><span>${pc(Wt[k][3])}</span></div>` : ""));
}

/* ---------- Rechnen und Anzeigen ---------- */
let last = null, cmpTimer = 0, runId = 0;
function verdictClass(sc) { return sc >= 90 ? ["good", "Sehr solide"] : sc >= 80 ? ["good", "Solide"] : sc >= 65 ? ["warn", "Knapp"] : ["bad", "Riskant"]; }
// Rechnen im Hintergrund: ein Worker für das Hauptergebnis, einer für Vergleiche und Stellschrauben (wird bei neuer Eingabe neu gestartet)
const WURL = (() => {
  try {
    const src = ($("engine-src") || {}).textContent; if (!src || typeof Worker === "undefined") return null;
    const w = src + `
const tl = r => { const s = new Set(); const add = v => { if (ArrayBuffer.isView(v)) s.add(v.buffer); }; Object.values(r).forEach(add); if (r.pension) add(r.pension.PN); return [...s]; };
onmessage = e => { const m = e.data;
  if (m.type === "main") { const r = simulateN(m.p, false, m.n); postMessage({ type: "main", id: m.id, r }, tl(r)); }
  else { const cmp = {}; for (const k in m.cmp) cmp[k] = simulateN(m.cmp[k], true, NMAX); postMessage({ type: "cmp", id: m.id, cmp }); postMessage({ type: "lev", id: m.id, d: leverData(m.p, m.when) }); } };`;
    return URL.createObjectURL(new Blob([w], { type: "text/javascript" }));
  } catch (e) { return null; }
})();
let mainW = null, sideW = null, mainBusy = false, mainPending = null, lastKey = "", shownId = 0, sideId = 0, sideBusy = false, sideTimer = 0, sideP = null;
const REQ = {};
function newWorker(onmsg) { try { const w = new Worker(WURL); w.onmessage = onmsg; w.onerror = () => { useSync(); }; return w; } catch (e) { return null; } }
function useSync() { if (mainW) mainW.terminate(); if (sideW) sideW.terminate(); mainW = sideW = null; mainBusy = sideBusy = false; WSYNC = true; lastKey = ""; schedule(); }
let WSYNC = !WURL;
function workerState() { return { worker: !!mainW && !WSYNC, sync: WSYNC }; }
let hookRender = () => {}, VIEWNOW = "quick";
function onMain(id, r) {
  const q = REQ[id]; delete REQ[id];
  if (!q || id < shownId) return;
  shownId = id; N = r.N; last = { p: q.p, r, cmp: null }; render(); hookRender();
  if (id === runId && q.n === NMAX) startSide(q.p); else $("lev").classList.add("busy");
}
function onMainMsg(e) {
  mainBusy = false; onMain(e.data.id, e.data.r);
  if (mainPending) { const m = mainPending; mainPending = null; mainBusy = true; mainW.postMessage(m); }
}
function run(preview) {
  syncOutputs();
  const p = readParams(), n = preview === true ? 400 : NMAX, key = JSON.stringify(p) + "|" + n;
  if (last && key === lastKey) { render(); return; }
  lastKey = key; const id = ++runId; REQ[id] = { p, n };
  if (!WSYNC && !mainW) mainW = newWorker(onMainMsg);
  if (!WSYNC && mainW) { const m = { type: "main", id, p, n }; if (mainBusy) { if (mainPending) delete REQ[mainPending.id]; mainPending = m; } else { mainBusy = true; mainW.postMessage(m); } }
  else onMain(id, simulateN(p, false, n));
}
function startSide(p) {
  const sid = ++sideId; sideP = p; $("lev").classList.add("busy"); clearTimeout(sideTimer);
  const cmp = {};
  if (p.tent) cmp.tent = readParams({ tent: false });
  if (p.trick) cmp.trick = readParams({ trick: false });
  if (p.wG > 0) { const k = 1 / (1 - p.wG); cmp.gold = readParams({ wG: 0, wE: p.wE * k, wC: p.wC * k, tPeak: p.tPeak * k, tLate: p.tLate * k }); }
  if (p.rOn) { const n = rentSellNet(p), c2 = Math.max(0, p.cap + n), b2 = Math.max(0, p.cap * (1 - p.gain0) + n); cmp.noRent = readParams({ rOn: false, cap: c2, gain0: c2 > 0 ? Math.max(0, 1 - b2 / c2) : 0 }); }
  { const a = SCEN[S.scen === "v" ? "o" : "v"]; cmp.alt = readParams({ re: a.re / 100, rb: a.rb / 100, rc: a.rc / 100, rgo: a.rg / 100 }); }
  if (Object.keys(cmp).some(k => k !== "alt" && k !== "noRent")) { $("cmpbox").hidden = false; $("cmpbox").innerHTML = `<p class="busy">Vergleich wird berechnet …</p>`; } else renderCmp();
  sideTimer = setTimeout(() => {
    if (sid !== sideId) return;
    const onSide = m => { if (m.id !== sideId) return; if (m.type === "cmp") { if (last && last.p === sideP) { last.cmp = m.cmp; renderCmp(); hookRender(); } } else { sideBusy = false; renderLev(m.d, sideP); } };
    if (!WSYNC) {
      if (sideW && sideBusy) { sideW.terminate(); sideW = null; }
      if (!sideW) sideW = newWorker(e => onSide(e.data));
      if (sideW) { sideBusy = true; sideW.postMessage({ type: "side", id: sid, p, when: S.when, cmp }); return; }
    }
    const c = {}; for (const k in cmp) c[k] = simulateN(cmp[k], true, NMAX);
    onSide({ type: "cmp", id: sid, cmp: c }); onSide({ type: "lev", id: sid, d: leverData(p, S.when) });
  }, WSYNC ? 300 : 120);
}
// Stellschrauben anzeigen (gerechnet im Hintergrund); ein Klick übernimmt die Änderung, „Rückgängig“ stellt sie zurück
let LEVD = null, LEVUNDO = null;
function applyLever(idx) {
  if (!LEVD) return; const { d, p } = LEVD, it = d.items[idx]; if (!it) return;
  LEVUNDO = { vals: Object.fromEntries(["contrib", "retAge", "net", "gapPct"].map(k => [k, gv(k)])), wmode: S.wmode, label: "" };
  const k = it.k;
  if (k === "contrib") setV("contrib", p.contrib + it.v);
  else if (k === "contribMinus") setV("contrib", Math.max(0, p.contrib - it.v));
  else if (k === "later") setV("retAge", p.retAge + it.v);
  else if (k === "earlier") setV("retAge", p.retAge - it.v);
  else if (k === "dyn") { const b = document.querySelector('[data-wmode="dyn"]'); if (b) b.click(); }
  else if (k === "net") { if (p.gapOn && GAP && GAP.base > 0) setV("gapPct", Math.round(it.v / GAP.base * 1000) / 10); else setV("net", it.v); }
  LEVUNDO.label = $("lev").querySelectorAll("li span")[idx] ? $("lev").querySelectorAll("li span")[idx].textContent : "";
  ["contrib", "retAge", "net", "gapPct"].forEach(showNum);
  syncAll(); schedule();
}
function undoLever() {
  if (!LEVUNDO) return; const u = LEVUNDO; LEVUNDO = null;
  Object.entries(u.vals).forEach(([k, v]) => { setV(k, v); showNum(k); });
  if (S.wmode !== u.wmode) { const b = document.querySelector(`[data-wmode="${u.wmode}"]`); if (b) b.click(); }
  syncAll(); schedule();
}
function renderLev(d, p) {
  const ul = $("lev"), pts = x => Math.round(x * 100), pf = s => pts(s) + " %", base = d.base;
  const diff = s => { const x = Math.round((pts(s) - pts(base)) * 10) / 10; return `${pf(s)} (${x > 0 ? "+" : x < 0 ? "−" : "±"}${nf1.format(Math.abs(x))} Pkt.)`; };
  let ri = 0;
  const row = (l, b, cls) => `<li><button type="button" class="levbtn" data-li="${ri++}" title="Übernehmen"><span>${esc(l)}</span><b class="${cls}">${esc(b)}</b></button></li>`;
  const incl = p.pOn ? "Wunscheinkommen" : "Entnahme";
  const L = {
    contrib: i => { const z = p.gapLink ? `, Ziel im Alter dann ${eur(Math.max(100, Math.round(Math.max(0, p.gapLink.base - i.v) * p.gapLink.pct / 100 / 50) * 50))}` : "";
      return d.mode === "below" ? (i.ok ? `Sparrate um ${eur(i.v)} erhöhen, auf ${eur(p.contrib + i.v)} im Monat${z}` : `Sparrate: auch ${eur(i.v)} mehr im Monat reichen allein nicht`) : `Sparrate ${eur(i.v)} höher${z}`; },
    contribMinus: i => `Sparrate ${eur(i.v)} niedriger` + (p.gapLink ? `, Ziel im Alter dann ${eur(Math.max(100, Math.round((p.gapLink.base + i.v) * p.gapLink.pct / 100 / 50) * 50))}` : ""),
    dyn: i => d.mode === "below" ? "Rate flexibel statt fest" : "Rate darf sich anpassen (flexibel)",
    later: i => d.mode === "below" && !i.ok ? `Später beginnen: auch ${i.v} Jahre später reichen allein nicht` : `${i.v}\u00a0${i.v === 1 ? "Jahr" : "Jahre"} später beginnen, mit ${p.retAge + i.v}`,
    earlier: i => `${i.v} Jahre früher, mit ${p.retAge - i.v}`,
    net: i => { const pc = p.gapOn && GAP && GAP.base > 0 ? ` (Anteil etwa ${Math.round(i.v / GAP.base * 100)} %)` : "";
      return d.mode === "below" ? (i.ok ? `${p.gapOn ? "Ziel im Alter" : incl} auf ${eur(i.v)} im Monat senken${pc || ` (${eur(p.net - i.v)} weniger)`}` : `${p.gapOn ? "Ziel im Alter" : incl} senken: reicht allein kaum`) : `${eur(i.v)} statt ${eur(p.net)} im Monat${pc}`; },
  };
  ul.innerHTML = d.items.map(i => d.mode === "below" ? row(L[i.k](i), (i.ok ? "" : "nur ") + pf(i.s), i.ok ? "up" : "")
    : row(L[i.k](i), diff(i.s), pts(i.s) - pts(base) > 0.05 ? "up" : pts(i.s) - pts(base) < -0.05 ? "dn" : "")).join("");
  ul.classList.remove("busy"); LEVD = { d, p };
  const found = d.items.some(i => i.ok);
  $("lev-t").textContent = d.mode === "roomy" ? "Dein Plan hat Luft: So viel Spielraum ist da" : d.mode === "green" ? "Im grünen Bereich: So wird es noch sicherer" : found ? "So kommst du in den grünen Bereich" : "Allein reicht keine Stellschraube für Grün";
  const undo = $("lev-u"); if (undo) { undo.hidden = !LEVUNDO; if (LEVUNDO) $("lev-ut").textContent = `Übernommen: ${LEVUNDO.label}.`; }
  $("lev-h").textContent = d.mode !== "below" ? `Jeweils nur eine Änderung, in genau denselben 2.000 Zukünften. Heute: ${pf(base)}. Tippe eine Zeile an, um sie zu übernehmen.`
    : found ? `Jede grüne Zeile bringt das Ergebnis allein auf mindestens 80 %, ab da zeigt die Ampel Grün. Kombiniert reicht von jedem weniger. Gerechnet in denselben 2.000 Zukünften, heute ${pf(base)}. Tippe eine Zeile an, um sie zu übernehmen.`
    : `Kombiniere mehrere Stellschrauben, zum Beispiel mehr sparen und flexibel entnehmen. Heute: ${pf(base)}.`;
}
// Vermietete Immobilie: Rechnung des ersten Jahres, Kreditende, Vergleich mit Verkauf heute (bei 2 % Inflation, ohne Zufall)
function renderRent() {
  const h = $("rent-h"); if (!h || !last) return;
  const p = readParams(), on = p.rOn; p.rOn = true;
  const Y = Math.max(1, p.age1 - p.age0), RY = Math.max(0, p.retAge - p.age0);
  const rsY = p.rSaleAge > 0 && p.rSaleAge - p.age0 < Y ? Math.max(0, p.rSaleAge - p.age0) : Infinity;
  const L = rentalLoan(p, Y, rsY), X = new Float64Array(Y + 1).fill(1), D = Float64Array.from({ length: Y + 1 }, (_, y) => Math.pow(1.02, y));
  pensionPlan(p, Y); const det = rentalFlows(p, Y, L, rsY, X, D, PXT, RY);
  if (!det.first) { h.textContent = ""; return; }
  const f = det.first, sg = x => (x >= 0 ? "+" : "−") + eur(Math.abs(Math.round(x)));
  let t = `Heute im Monat: Miete ${eur(Math.round(f.rent))} − Kosten ${eur(Math.round(f.cost))} − Rate ${eur(Math.round(f.pay))} ${f.tax <= 0 ? "+ Steuererstattung " + eur(Math.round(-f.tax)) : "− Steuer " + eur(Math.round(f.tax))} = ${sg(f.cf)} (${f.cf >= 0 ? "geht ins Depot" : "kommt aus dem Depot"}).`;
  const noi = (f.rent - f.cost) * 12, kz = [];
  if (p.rrent > 0 && p.rv > 0) kz.push(`Kaufpreisfaktor ${nf1.format(p.rv / (12 * p.rrent))} (Marktwert durch Jahreskaltmiete)`);
  if (p.rv > 0) kz.push(`Netto-Mietrendite auf den Marktwert ${nf1.format(noi / p.rv * 100)} %`);
  if (kz.length) t += ` ${kz.join(", ")}; nach Kosten und Mietausfall, vor Kredit und Steuer.`;
  if (p.rdebt > 0 && L.payoff != null) t += ` Kredit abbezahlt mit ${Math.round(p.age0 + L.payoff)}` + (det.after ? `, danach etwa ${sg(det.after.cf)} im Monat nach Steuer, in heutiger Kaufkraft.` : ".");
  if (on && last.cmp && last.cmp.noRent) { const n = rentSellNet(p), y0 = p.year0 || 2026; t += ` Heute verkauft, ${n >= 0 ? eur(Math.round(n / 100) * 100) + " Erlös ins Depot" : eur(Math.round(-n / 100) * 100) + " Restschuld aus dem Depot getilgt"}: ${pInt(last.cmp.noRent.success)} statt ${pInt(last.r.success)} beim Halten (nach ${Math.round(RSELL * 100)} % Verkaufskosten${y0 - p.rbuyY < 10 ? ", ohne Steuer auf den Gewinn, weil noch keine 10 Jahre" : ""}${p.rdebt > 0 && p.rlzb > 0 ? ", ohne Vorfälligkeitsentschädigung" : ""}).`; }
  h.textContent = t;
}
let METERCLS = "good", VERDICT_SEEN = true;
// Leiste unten: Ergebnis bleibt sichtbar, während man in „Ausführlich“ Regler bewegt
function updBar() {
  const bar = $("rbar"); if (!bar) return;
  const show = !!last && VIEWNOW === "full" && !VERDICT_SEEN;
  bar.hidden = !show; document.body.classList.toggle("has-rbar", show);
  if (!show) return;
  const { r, cmp } = last, alt = cmp && cmp.alt, sc = Math.round(r.success * 100), [cls, txt] = verdictClass(sc);
  $("rbar-p").className = "pill " + cls; $("rbar-p").textContent = txt;
  $("rbar-v").textContent = `${succTxt(r.success).replace("etwa ", "≈ ")} bis ${last.p.age1}`;
  if (alt) { const a = Math.round(Math.min(r.success, alt.success) * 20) * 5, b = Math.round(Math.max(r.success, alt.success) * 20) * 5; $("rbar-s").textContent = a === b ? "bei beiden Börsen-Annahmen" : `je nach Börse ${a}–${b} %`; }
  else $("rbar-s").textContent = "Vergleich wird berechnet …";
}
if (typeof IntersectionObserver !== "undefined") {
  const vd = document.querySelector(".verdict");
  if (vd) new IntersectionObserver(es => { VERDICT_SEEN = es[es.length - 1].isIntersecting; updBar(); }, { threshold: 0.05 }).observe(vd);
}
document.addEventListener("click", e => { if (e.target && e.target.id === "rbar-b") document.querySelector(".verdict").scrollIntoView({ behavior: "smooth", block: "start" }); });
// Spanne über beide Märkte: ehrlicher als eine einzelne Zahl
function renderSpan() {
  const el = $("span-h"); if (!el || !last) return;
  const { r, cmp } = last, alt = cmp && cmp.alt;
  const mt = document.querySelector(".verdict .meter"), band = $("meter-span"), dot = $("meter-dot");
  if (alt && mt) {
    const lo = Math.min(r.success, alt.success) * 100, hi = Math.max(r.success, alt.success) * 100;
    mt.classList.add("span"); band.hidden = false; dot.hidden = false;
    band.style.left = lo + "%"; band.style.width = Math.max(1.5, hi - lo) + "%"; band.style.background = `var(--${METERCLS})`;
    dot.style.left = r.success * 100 + "%"; dot.style.background = `var(--${METERCLS})`;
  } else if (mt) { mt.classList.remove("span"); band.hidden = true; dot.hidden = true; }
  updBar();
  if (VIEWNOW === "quick" || !alt) { el.textContent = ""; el.hidden = true; return; }
  el.hidden = false;
  const bare = s => succTxt(s).replace("etwa ", "");
  if (S.scen === "o" || S.scen === "v") {
    const normal = S.scen === "o" ? r.success : alt.success, weak = S.scen === "v" ? r.success : alt.success;
    el.textContent = bare(weak) === bare(normal) ? `Bei eher schwacher wie bei normaler Börse ${succTxt(weak)}.` : `Je nach Börse ${bare(weak).replace("\u00a0%", "")} bis ${bare(normal)}: eher schwach bis wie früher. Die Spanne sagt mehr als jede einzelne Zahl.`;
  } else el.textContent = `Mit deinen Annahmen ${succTxt(r.success)}, bei eher schwacher Börse ${succTxt(alt.success)}. Diese Spanne sagt mehr als jede einzelne Zahl.`;
}
// Wie lange muss es reichen? Quote nach Alter und Wahrscheinlichkeit, so alt zu werden
let LIFETXT = "";
function renderLife() {
  const el = $("life"); if (!el || !last) return;
  const { p, r } = last, n = r.N || NMAX, fa = r.failAges, y0 = p.year0 || 2026;
  let ages = [80, 85, 90, 95, 100].filter(A => A > p.retAge && A < p.age1); ages.push(p.age1); ages = ages.slice(-4);
  if (p.age1 <= p.retAge) { el.innerHTML = ""; LIFETXT = ""; return; }
  const ok = A => 1 - fa.filter(a => a < A).length / n, sv = (L, A) => survive(L, p.age0, A, y0);
  const risk = L => fa.reduce((s, a) => s + sv(L, a), 0) / n;
  let h = `<p><strong>Wie lange muss es reichen?</strong></p><div class="lt" style="grid-template-columns:minmax(0,1fr) repeat(${ages.length},auto)"><span class="h"></span>` + ages.map(A => `<span class="c">bis ${A}</span>`).join("");
  const c5 = s => p5(s).replace("über ", "> ").replace("unter ", "< ");
  h += `<span class="h">Geld reicht</span>` + ages.map(A => `<span><b>${c5(ok(A))}</b></span>`).join("");
  h += `<span class="h">Erleben Männer</span>` + ages.map(A => `<span>${c5(sv(LXM, A))}</span>`).join("");
  h += `<span class="h">Erleben Frauen</span>` + ages.map(A => `<span>${c5(sv(LXF, A))}</span>`).join("") + `</div>`;
  const rm = risk(LXM), rf = risk(LXF), om = sv(LXM, p.age1), of = sv(LXF, p.age1);
  LIFETXT = `Gewichtet mit der Lebenserwartung geht das Geld bis ${p.age1} zu Lebzeiten aus: bei einem Mann in ${succTxt(rm)} der Fälle, bei einer Frau in ${succTxt(rf)}. Älter als ${p.age1} werden ${succTxt(om)} der Männer und ${succTxt(of)} der Frauen deines Jahrgangs; darüber rechnet der Rechner nicht.`;
  h += `<p hidden>Geld reicht ${ages.map(A => "bis " + A + ": " + c5(ok(A))).join(", ")}. Erleben Männer ${ages.map(A => A + ": " + c5(sv(LXM, A))).join(", ")}; Frauen ${ages.map(A => A + ": " + c5(sv(LXF, A))).join(", ")}.</p>`;
  h += `<p class="hint">${LIFETXT} Grundlage: Sterbetafel 2020/2022 des Statistischen Bundesamts, Sterblichkeit sinkt um 1 % pro Jahr.</p>`;
  el.innerHTML = h;
}
function renderCmp() {
  renderRent();
  renderSpan(); renderLife();
  const { p, r, cmp } = last, box = $("cmpbox"), pts = x => Math.round(x * 100);
  if (!p.tent && !p.trick && !(p.wG > 0)) { box.innerHTML = ""; box.hidden = true; return; }
  box.hidden = false;
  if (!cmp) return;
  const pf = x => nf1.format(x) + " %";
  const diff = d => { d = Math.round(d); return (d > 0 ? "+" : d < 0 ? "−" : "±") + Math.abs(d) + " Pkt."; };
  let h = `<h3>Was bringen deine Schalter?</h3>`;
  if (cmp.tent) {
    const a = pts(r.success), b = pts(cmp.tent.success);
    h += `<div class="cmp"><span class="l">Anleihezelt</span><span class="r">${pf(a)} statt ${pf(b)} (${diff(a - b)})</span><span class="h">Typisch mit ${p.retAge}: ${eurR(r.retMed)} statt ${eurR(cmp.tent.retMed)}, schlecht: ${eurR(r.retLow)} statt ${eurR(cmp.tent.retLow)}. Übrig mit ${p.age1}: ${eurR(r.endMed)} statt ${eurR(cmp.tent.endMed)}. Steuern in der Ansparphase: ${eurR(r.taxAcc)} statt ${eurR(cmp.tent.taxAcc)}.${p.stress !== "none" && S.when === "ret" ? " Achtung: Eine Krise genau zum Start der Entnahme ist der günstigste Fall fürs Zelt. Prüfe es auch ohne Härtetest und mit Krise 5 Jahre vorher." : p.stress === "none" ? " Ohne Härtetest zeigt sich, was das Zelt im Durchschnitt kostet oder bringt." : ""}</span></div>`;
  }
  if (cmp.trick) {
    const a = pts(r.success), b = pts(cmp.trick.success);
    h += `<div class="cmp"><span class="l">Zweitdepot-Trick</span><span class="r">${pf(a)} statt ${pf(b)} (${diff(a - b)})</span><span class="h">Steuern in den ersten 10 Jahren der Entnahme: ${eurR(r.taxRet10)} statt ${eurR(cmp.trick.taxRet10)}; während der ganzen Entnahme ${eurR(r.taxRet)} statt ${eurR(cmp.trick.taxRet)}. Übrig mit ${p.age1}: ${eurR(r.endMed)} statt ${eurR(cmp.trick.endMed)}.</span></div>`;
  }
  if (cmp.gold) {
    const a = pts(r.success), b = pts(cmp.gold.success);
    h += `<div class="cmp"><span class="l">Gold</span><span class="r">${pf(a)} statt ${pf(b)} (${diff(a - b)})</span><span class="h">Verglichen mit demselben Depot ohne Gold, dessen Anteil anteilig auf die anderen Klassen verteilt. Typisch mit ${p.retAge}: ${eurR(r.retMed)} statt ${eurR(cmp.gold.retMed)}, schlecht: ${eurR(r.retLow)} statt ${eurR(cmp.gold.retLow)}. Übrig mit ${p.age1}: ${eurR(r.endMed)} statt ${eurR(cmp.gold.endMed)}. Steuern während der Entnahme: ${eurR(r.taxRet)} statt ${eurR(cmp.gold.taxRet)}.${p.stress !== "none" && p.stress !== "gfall" ? " Die meisten Krisen im Härtetest waren gute Goldjahre; prüfe auch den Goldabsturz." : ""}</span></div>`;
  }
  h += `<p class="hint">Erfolgsquote mit einer Nachkommastelle, damit kleine Unterschiede nicht durch Runden größer wirken. Beträge typisch, in heutiger Kaufkraft, jeweils verglichen mit derselben Einstellung ohne den Schalter.</p>`;
  box.innerHTML = h;
}
function render() {
  renderRent();
  const { p, r } = last, Y = r.Y, RY = Math.min(r.RY, Y), real = S.mode === "real";
  const Wv = stats(real ? r.totR : r.totN, 0, Y + 1), T = stats(r.taxY, 0, Y);
  const NW = r.netR ? stats(real ? r.netR : r.netN, 0, Y + 1) : null;
  const ages = Array.from({ length: Y + 1 }, (_, k) => p.age0 + k);
  last.ch = { ages, Wv, NW, RT: null, ra: null };
  const st = STRESS[p.stress];
  const bar = $("stressbar"); bar.className = "stressbar" + (st ? " on" : "");
  const sAge = p.age0 + p.off;
  bar.textContent = st ? `Härtetest aktiv: ${st.name}, beginnend mit ${sAge} Jahren.` : "";
  const unit = real ? "in heutiger Kaufkraft" : "auf dem Kontoauszug";

  // Urteil
  const sc = Math.round(r.success * 100), [cls, txt] = verdictClass(sc);
  $("pill").className = "pill " + cls; $("pill").textContent = txt;
  $("meter").style.width = sc + "%"; $("meter").style.background = `var(--${cls})`; METERCLS = cls;
  $("headline").textContent = `In ${succTxt(r.success)} der Zukünfte reicht das Geld bis ${p.age1}.`;
  let sub = RY > 0 ? `Mit ${p.retAge} hast du typischerweise ${eurR(Wv.p50[RY])} ${unit}, wenn es schlecht läuft ${eurR(Wv.p10[RY])}. ` : "";
  sub += p.wmode === "dyn" ? `Die Rate startet bei ${eur10(p.net)} und passt sich dann an.` : p.indexed ? `Die Rate von ${eur10(p.net)} behält ihre Kaufkraft.` : `Die Rate bleibt auf dem Konto bei ${eur10(p.net)}.`;
  if (r.failAges.length) {
    const fa = r.failAges.slice().sort((a, b) => a - b), fg = (r.failGaps || []).slice().sort((a, b) => a - b), mid = a => a[Math.floor(a.length / 2)];
    const g = fg.length ? mid(fg) : null, inc = p.pOn && p.rOn ? "Rente und Mieteinnahmen" : p.pOn ? "die Rente" : p.rOn ? "die Mieteinnahmen" : "";
    sub += ` In den übrigen Zukünften (${succTxt(1 - r.success)}) ist das Depot vorher leer, typischerweise mit ${mid(fa)}.`;
    if (g != null) sub += g < 50 ? (inc ? ` Dann ${inc === "Rente und Mieteinnahmen" ? "decken Rente und Mieteinnahmen" : "deckt " + inc} fast alles.` : "")
      : inc ? ` Dann bleibt nur ${inc}, und zum Wunsch fehlen etwa ${eur10(g)} im Monat, in heutiger Kaufkraft.` : ` Dann fehlt das ganze Einkommen von etwa ${eur10(g)} im Monat, in heutiger Kaufkraft.`;
  }
  // Flexible Rate: wie oft und wie stark muss das Einkommen sinken?
  if (p.wmode === "dyn" && p.indexed && r.rateR && Y > RY) {
    const n = r.rateR.length / Y, lows = [];
    // nur Zukünfte, in denen das Depot reicht; die anderen beschreibt der Satz davor
    for (let i = 0; i < n; i++) { if (!(r.totR && r.totR[Y * n + i] > 0)) continue; let m = Infinity; for (let y = RY; y < Y; y++) { const v = r.rateR[y * n + i]; if (v > 0 && v < m) m = v; } if (isFinite(m)) lows.push(m); }
    lows.sort((a, b) => a - b); const cut = lows.filter(v => v < p.net * 0.9).length / n;
    if (cut >= 0.01 && lows.length) sub += ` Auch wo es reicht, sinkt dein Einkommen mit der flexiblen Rate in ${succTxt(cut)} der Zukünfte zeitweise um mehr als 10 %, im schlechtesten Zehntel davon bis auf etwa ${eur10(lows[Math.floor(lows.length * 0.1)])} im Monat.`;
  }
  if (p.pOn && r.pension && r.pension.first) { const nr = r.pension.first.net / Math.pow(1 + p.inf, r.pension.PY); sub += nr >= p.net ? ` Die gesetzliche Rente (etwa ${eur10(nr)}) liegt ab ${p.age0 + r.pension.PY} über deinem Wunsch. Dann ist die ganze Rente dein Einkommen, und das Depot muss nichts dazu beitragen; es zahlt nur seine eigene Steuer.` : ` Die gesetzliche Rente deckt ab ${p.age0 + r.pension.PY} davon etwa ${eur10(nr)}, den Rest liefert das Depot.`; }
  if (p.extra > 0) sub += ` Bis ${p.xAge} kommen ${eur(p.extra)} im Monat für die aktiven Jahre dazu.`;
  if (sc < 80) sub += p.wmode === "dyn" ? " Eine niedrigere Rate oder mehr Sparen macht den Plan sicherer." : " Eine niedrigere Rate, mehr Sparen oder eine flexible Rate macht den Plan sicherer.";
  $("subline").textContent = sub;
  // Drei Zahlen statt eines langen Absatzes; die Details stehen aufklappbar darunter
  {
    const f = [], card = (l, v, s) => `<div class="fact"><span class="l">${l}</span><b>${v}</b><span class="s">${s}</span></div>`;
    const short = real ? "heutige Kaufkraft" : "Kontoauszug";
    if (RY > 0) f.push(card(`Mit ${p.retAge}`, eurR(Wv.p50[RY]), `typisch · schlecht ${eurR(Wv.p10[RY])} · ${short}`));
    else f.push(card("Heute angelegt", eurR(p.cap), short));
    if (r.failAges.length) {
      const fa = r.failAges.slice().sort((a, b) => a - b), fg = (r.failGaps || []).slice().sort((a, b) => a - b), g = fg.length ? fg[Math.floor(fg.length / 2)] : 0;
      const inc = p.pOn && p.rOn ? "Rente und Miete decken" : p.pOn ? "die Rente deckt" : p.rOn ? "die Miete deckt" : "";
      f.push(card("Wenn es nicht reicht", `ab ${fa[Math.floor(fa.length / 2)]}`, g >= 50 ? `fehlen dann etwa ${eur10(g)} im Monat (heutige Kaufkraft)` : inc ? `${inc} dann fast alles` : "typisches Alter, ab dem das Depot leer ist"));
    } else f.push(card(`Übrig mit ${p.age1}`, eurR(Wv.p50[Y]), `typisch · ${short}`));
    if (p.pOn && r.pension && r.pension.first) {
      const nr = r.pension.first.net / Math.pow(1 + p.inf, r.pension.PY);
      f.push(card(`Rente ab ${p.age0 + r.pension.PY}`, eur10(nr), nr >= p.net ? "netto, über deinem Wunsch" : `netto von ${eur10(p.net)} Wunsch, den Rest zahlt das Depot`));
    } else f.push(card("Entnahme", eur10(p.net), p.wmode === "dyn" ? "pro Monat, passt sich an" : p.indexed ? "pro Monat, behält die Kaufkraft" : "pro Monat, fest auf dem Konto"));
    $("facts").innerHTML = f.join("");
  }
  renderSpan(); renderLife(); updBar();

  // Kennzahlen
  $("k1-l").textContent = `Vermögen mit ${p.retAge}`;
  $("k1").textContent = eurR(Wv.p50[RY]); $("k1-s").textContent = `typisch ${unit} · schlecht ${eurR(Wv.p10[RY])}` + (NW ? ` · inkl. Haus abzüglich Restschuld ${eurR(NW.p50[RY])}` : "");
  $("k2").textContent = eur10(real ? r.gross1 : r.gross1N);
  const loanR = r.loan1 / Math.pow(1 + p.inf, RY);
  $("k2-s").textContent = `pro Monat im ersten Jahr der Entnahme, davon etwa ${eur10(real ? r.tax1 : r.tax1N)} Steuer` + (loanR > 0.5 ? ` und ${eur10(real ? loanR : r.loan1)} Kreditrate` : "") + ` (${unit})`;
  // Rente-Info
  {
    const pl = r.pension && r.pension.first ? r.pension : pensionPlan(Object.assign({}, p, { pOn: true }), r.Y), el = $("pens-h");
    if (pl && pl.first) {
      const dfl = Math.pow(1 + p.inf, pl.PY), netR = pl.first.net / dfl, dep = Math.max(0, p.net - netR);
      el.textContent = `Mit ${p.age0 + pl.PY} (${pl.year}): brutto ${eur10(pl.first.gross)}, davon ${eur10(pl.first.kv)} ${p.kvPriv ? "PKV nach Zuschuss" : "Kranken- und Pflegeversicherung"} und ${eur10(pl.first.tax)} Steuer (steuerpflichtig sind ${nf1.format(pl.BA * 100)} %, darauf ${nf1.format(pl.first.rate * 100)} %${p.ptaxAuto ? `; Grundfreibetrag ${pl.year} angenommen ${eur10(pl.first.gfb)}` : ""}). Netto ${eur10(pl.first.net)} im Monat, in heutiger Kaufkraft etwa ${eur10(netR)}.` +
        (Math.abs(p.pniv - 0.48) > 1e-9 ? ` Bei ${nf1.format(p.pniv * 100)} % statt 48 % Rentenniveau sind das etwa ${eur10(Math.abs(netR - pensionPlan(Object.assign({}, p, { pOn: true, pniv: 0.48 }), r.Y).first.net / dfl))} ${p.pniv < 0.48 ? "weniger" : "mehr"} im Monat.` : "") +
        (p.pOn ? (dep > 0 ? ` Vom gewünschten Einkommen muss das Depot dann noch etwa ${eur10(dep)} liefern.` : " Damit liegt die Rente über deinem Wunsch; dein Einkommen ist dann die ganze Rente, das Depot zahlt nichts dazu.") : "");
    } else el.textContent = "";
  }
  { const pl = r.pension && r.pension.first ? r.pension : pensionPlan(Object.assign({}, p, { pOn: true }), r.Y), f = pl.first;
    if (f && p.kvPriv) { const dfl = Math.pow(1 + p.inf, pl.PY);
      $("pkv-h").textContent = `Mit ${p.age0 + pl.PY} (${pl.year}): PKV-Beitrag etwa ${eur10(f.prem)} im Monat (ohne die wegfallenden Teile und den 10-%-Zuschlag${p.bel ? ", nach Entlastung" : ""}). Die Rentenversicherung zahlt ${eur10(f.zus)} dazu${f.zus >= f.prem / 2 - 0.5 ? " (die Hälfte des Beitrags, mehr gibt es nicht)" : ""}. Du zahlst ${eur10(f.kv)} im Monat, in heutiger Kaufkraft etwa ${eur10(f.kv / dfl)}.`; } }
  if (GAP) {
    const pl = r.pension && r.pension.first ? r.pension : null, nr = p.pOn && pl ? pl.first.net / Math.pow(1 + p.inf, pl.PY) : 0, ag = pl ? p.age0 + pl.PY : p.retAge;
    const parts = [`Netto ${eur(GAP.inc0)}`]; if (GAP.sav) parts.push(`Sparrate ${eur(GAP.sav)}`); if (GAP.loan) parts.push(`Kreditrate ${eur(Math.round(GAP.loan))}`);
    const gap = Math.max(0, GAP.target - nr), gapX = Math.max(0, GAP.target + p.extra - nr);
    let t = `Ziel im Alter: (${parts.join(" − ")}) × ${GAP.pct} % = ${eur(GAP.target)} im Monat. `;
    t += p.pOn ? `Gesetzliche Rente mit ${ag} netto, in heutiger Kaufkraft: etwa ${eur10(nr)}. ` : "Ohne eingerechnete Rente muss das Depot das ganze Ziel liefern. ";
    t += gap > 0 ? `Rentenlücke: etwa ${eur10(gap)} im Monat` : "Die Rente deckt das Ziel bereits, es gibt keine Lücke";
    if (p.extra > 0) t += `, in den aktiven Jahren bis ${p.xAge} mit dem Extra etwa ${eur10(gapX)}`;
    t += ".";
    if (GAP.loanLate) t += " Die Kreditrate ist nicht abgezogen, weil der Kredit erst nach dem Start der Entnahme abbezahlt ist; das Depot zahlt sie dann zusätzlich.";
    $("gap-h").textContent = t;
  }
  if (p.home && p.debt > 0) {
    const pa = r.payoff, mo = eur((p.lrate + p.lsond / 12) * p.lshare * p.fp), sale = p.flows.find(f => f.type === "sale");
    let t;
    if (pa == null) t = sale ? `Der Kredit ist bis zum Hausverkauf mit ${sale.age} nicht abbezahlt; die Restschuld wird aus dem Erlös getilgt.` : `Mit dieser Rate wird der Kredit nicht abbezahlt, bevor das Geld bis ${p.age1} reichen soll. Die Rate deckt kaum mehr als die Zinsen.`;
    else {
      const age = p.age0 + pa, ageS = nf1.format(Math.round(age * 10) / 10);
      t = age <= p.retAge ? (p.fp > 0 ? `Abbezahlt mit ${ageS} Jahren. Ab dann fließen ${mo} im Monat zusätzlich in den Sparplan (${Math.round(p.fp * 100)} % von deinem Anteil an Rate und Sondertilgung, ${eur((p.lrate + p.lsond / 12) * p.lshare)}).` : `Abbezahlt mit ${ageS} Jahren. Danach fließt nichts zusätzlich ins Depot.`)
        : `Abbezahlt erst mit ${ageS} Jahren, also nach dem Start der Entnahme. Bis dahin wird die Rate zusätzlich aus dem Depot genommen.`;
    }
    const L2 = loanPlan(p, Math.max(1, p.age1 - p.age0), Infinity);
    if (L2.rate2 > p.lrate + 0.5) t += ` Nach der Zinsbindung reicht die Rate nicht mehr für Zins und 1 % Tilgung und steigt auf ${eur(Math.round(L2.rate2))}. Dein Anteil an der Differenz (${eur(Math.round((L2.rate2 - p.lrate) * p.lshare))}) geht bis zur Rente von der Sparrate ab.`;
    $("loan-h").textContent = t;
  } else $("loan-h").textContent = p.home ? "Ohne Restschuld: kein Kredit, nur der Hauswert zählt ins Gesamtvermögen." : "";
  $("k3").textContent = eurR(real ? r.taxRet : r.taxRetN);
  $("k3-s").textContent = `typisch, ${unit}${p.pOn ? ", nur aufs Depot" : ""} · davon in den ersten 10 Jahren ${eurR(real ? r.taxRet10 : r.taxRet10N)}` + (RY > 0 ? ` · in der Ansparphase ${eurR(real ? r.taxAcc : r.taxAccN)}` : "");
  $("k4-l").textContent = `Übrig mit ${p.age1}`; $("k4").textContent = eurR(Wv.p50[Y]);

  const stressSpan = st ? [sAge, sAge + Math.max(st.eq.length, (st.gd || []).length)] : null;
  // Vermögen
  const marks = p.flows.map((f, k) => ({ age: f.age, type: f.type === "out" ? "out" : "in", label: (f.type === "out" ? "− " : "+ ") + f.label, row: k }));
  drawLines($("ch-w"), ages, { band: [Wv.p25, Wv.p75], mid: Wv.p50, low: Wv.p10, tot: NW ? NW.p50 : null, top: NW ? Wv.p75.concat(NW.p50) : Wv.p75 },
    { fmt: axisEur, label: "Vermögensverlauf", ret: p.retAge, stress: stressSpan, tipFmt: eurR, marks,
      rows: [["typisch", Wv.p50], ["schlecht (untere 10 %)", Wv.p10], ["gut (obere 25 %)", Wv.p75]].concat(NW ? [["inkl. Haus (typisch)", NW.p50]] : []) });
  $("leg-net").hidden = !NW;
  // Aufteilung
  const Wt = r.W.concat([r.W[r.W.length - 1]]);
  drawAlloc($("ch-a"), ages, Wt, { label: "Aufteilung nach Alter", ret: p.retAge });
  const w0 = r.W[0], wr = r.W[Math.min(RY, Y - 1)];
  $("alloc-h").textContent = p.tent
    ? `Zielquoten, auf die jedes Jahr hingearbeitet wird. Aktien von ${Math.round(w0[0] * 100)} % auf ${Math.round(wr[0] * 100)} % zum Rentenbeginn, danach über ${yrs(p.tDown)} auf ${Math.round(p.tLate * 100)} %. Der Aufbau des Zelts bedeutet Aktienverkäufe; die Steuer darauf ist eingerechnet.`
    : `Zielquoten, auf die jedes Jahr hingearbeitet wird: immer ${Math.round(w0[0] * 100)} % Aktien, ${Math.round(w0[1] * 100)} % Anleihen, ${Math.round(w0[2] * 100)} % Geldmarkt` + (w0[3] > 0 ? `, ${Math.round(w0[3] * 100)} % Gold.` : ".");
  // Rate
  if (RY < Y) {
    $("rate-p").hidden = false;
    const RT = stats(real ? r.rateR : r.rateN, RY, Y), ra = ages.slice(RY, Y); last.ch.RT = RT; last.ch.ra = ra;
    const PEN = p.pOn && r.pension && r.pension.first ? (real ? stats(r.penR, RY, Y).p50 : Array.from(r.pension.PN.slice(RY, Y))) : null; last.ch.PEN = PEN;
    $("leg-pen").hidden = !PEN;
    drawLines($("ch-r"), ra, { area: PEN, mid: RT.p50, low: RT.p10, high: RT.p90, top: RT.p90.concat(RT.p50.map(v => v * 1.25)) },
      { fmt: v => nf0.format(v) + " €", label: "Verlauf der Monatsrate", ref: real ? p.net : 0, refLabel: (p.pOn || p.gapOn ? "Ziel " : "Start ") + eur(p.net) + (p.extra > 0 ? `, bis ${p.xAge} + ${eur(p.extra)}` : ""), stress: stressSpan, tipFmt: eur10,
        rows: [["typisch", RT.p50], ["schlecht (untere 10 %)", RT.p10], ["gut (obere 10 %)", RT.p90]].concat(PEN ? [["davon Rente (netto)", PEN]] : []) });
    $("rate-t").textContent = p.pOn ? "So entwickelt sich dein Netto-Einkommen" : "So entwickelt sich deine Monatsrate";
    $("rate-h").textContent = (real ? "In heutiger Kaufkraft, nach Steuern. " : "Auf dem Kontoauszug, nach Steuern. ") + (p.pOn ? "Rente und Depot zusammen. Ist das Depot aufgebraucht, bleibt nur die Rente." : "Fällt die Rate auf 0 €, ist das Geld aufgebraucht.");
  } else $("rate-p").hidden = true;
  // Steuern
  const ta = ages.slice(0, Y);
  drawLines($("ch-t"), ta, { mid: T.p50, high: T.p90, top: T.p90 },
    { fmt: v => nf0.format(v) + " €", label: "Steuer pro Jahr", ret: p.retAge, stress: stressSpan, tipFmt: eur10,
      rows: [["typisch", T.p50], ["hoch (obere 10 %)", T.p90]] });
  $("tax-h").textContent = "In heutiger Kaufkraft. In der Ansparphase ist das vor allem die Vorabpauschale und Steuer aufs Umschichten, in der Entnahme kommen die Gewinne aus den Verkäufen dazu. Der Freibetrag ist schon abgezogen.";
}

/* ---------- PDF-Auswertung (eigener kleiner PDF-Schreiber, Schrift Helvetica, Grafiken als Vektoren) ---------- */
const PDFW = { r: [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,556,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,556,556,333,556,537,278,333,556,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500], b: [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,556,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,556,556,333,611,556,278,333,556,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556] };
const CP = { 0x20AC: 128, 0x201A: 130, 0x201E: 132, 0x2026: 133, 0x2018: 145, 0x2019: 146, 0x201C: 147, 0x201D: 148, 0x2022: 149, 0x2013: 150, 0x2014: 151, 0x2122: 153 };
const CPREP = { 0x2212: "-", 0x2009: " ", 0x202F: " ", 0x2007: " ", 0x2248: "~", 0x2264: "<=", 0x2265: ">=", 0x2192: "->", 0x2713: "" };
function pdfEnc(s) {
  let o = "";
  for (const ch of String(s)) { const c = ch.codePointAt(0);
    if (c >= 32 && c < 127 || c >= 160 && c < 256) o += ch; else if (CP[c]) o += String.fromCharCode(CP[c]); else if (CPREP[c] != null) o += CPREP[c]; else if (c === 10) o += " "; else o += "?"; }
  return o;
}
class Pdf {
  constructor() { this.W = 595.28; this.H = 841.89; this.pages = []; this.add(); }
  add() { this.c = []; this.pages.push(this.c); }
  tw(s, size, bold) { const t = PDFW[bold ? "b" : "r"]; let w = 0; for (const ch of pdfEnc(s).replace(/\u00a0/g, " ")) w += t[ch.charCodeAt(0) - 32] || 556; return w * size / 1000; }
  col(c) { return c.map(v => (v / 255).toFixed(3)).join(" "); }
  text(x, y, s, o = {}) {
    const size = o.size || 9.5, b = !!o.bold, e = pdfEnc(s); let xx = x;
    if (o.align === "right") xx = x - this.tw(s, size, b); else if (o.align === "center") xx = x - this.tw(s, size, b) / 2;
    const esc = e.replace(/[\\()]/g, m => "\\" + m).replace(/[\x80-\xff]/g, m => "\\" + m.charCodeAt(0).toString(8).padStart(3, "0"));
    this.c.push(`BT /F${b ? 2 : 1} ${size} Tf ${this.col(o.color || [20, 32, 48])} rg ${xx.toFixed(2)} ${(this.H - y).toFixed(2)} Td (${esc}) Tj ET`);
  }
  wrap(s, maxw, size, bold) {
    const out = []; let line = "";
    for (let w of String(s).split(/\s+/).filter(Boolean)) {
      while (this.tw(w, size, bold) > maxw && w.length > 1) { let k = w.length - 1; while (k > 1 && this.tw(w.slice(0, k), size, bold) > maxw) k--; if (line) { out.push(line); line = ""; } out.push(w.slice(0, k)); w = w.slice(k); }
      const t = line ? line + " " + w : w; if (this.tw(t, size, bold) > maxw && line) { out.push(line); line = w; } else line = t;
    }
    if (line) out.push(line); return out;
  }
  // Absatz mit fetten und normalen Teilen: segs = [[text, fett], ...]
  rich(x, y, segs, maxw, o = {}) {
    const size = o.size || 9, lh = o.lh || size * 1.4, sp = this.tw(" ", size), words = [];
    segs.forEach(([t, b]) => String(t).split(/\s+/).filter(Boolean).forEach(w => words.push([w, b])));
    let line = [], lw = 0;
    const flush = () => { let xx = x; line.forEach(([w, b]) => { this.text(xx, y, w, { size, bold: b, color: b ? PC.ink : o.color || PC.ink }); xx += this.tw(w, size, b) + sp; }); line = []; lw = 0; y += lh; };
    for (const [w, b] of words) { const ww = this.tw(w, size, b); if (line.length && lw + sp + ww > maxw) flush(); lw += (line.length ? sp : 0) + ww; line.push([w, b]); }
    if (line.length) flush(); return y;
  }
  para(x, y, s, maxw, o = {}) { const size = o.size || 9.5, lh = o.lh || size * 1.35; for (const l of this.wrap(s, maxw, size, o.bold)) { this.text(x, y, l, o); y += lh; } return y; }
  line(x1, y1, x2, y2, o = {}) { this.c.push(`q ${this.col(o.color || [214, 222, 232])} RG ${o.width || 0.6} w ${o.dash ? "[" + o.dash.join(" ") + "] 0 d" : ""} ${x1.toFixed(2)} ${(this.H - y1).toFixed(2)} m ${x2.toFixed(2)} ${(this.H - y2).toFixed(2)} l S Q`); }
  rect(x, y, w, h, o = {}) { this.c.push(`q ${o.fill ? this.col(o.fill) + " rg" : ""} ${o.stroke ? this.col(o.stroke) + " RG 0.6 w" : ""} ${x.toFixed(2)} ${(this.H - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${o.fill && o.stroke ? "B" : o.fill ? "f" : "S"} Q`); }
  path(pts, o = {}) {
    if (pts.length < 2) return;
    const d = pts.map(([x, y], i) => `${x.toFixed(2)} ${(this.H - y).toFixed(2)} ${i ? "l" : "m"}`).join(" ");
    this.c.push(`q ${o.fill ? this.col(o.fill) + " rg" : ""} ${o.stroke ? this.col(o.stroke) + " RG" : ""} ${o.width || 1} w 1 j ${o.dash ? "[" + o.dash.join(" ") + "] 0 d" : ""} ${d} ${o.fill ? "h f" : "S"} Q`);
  }
  bytes(title) {
    const objs = [], n = this.pages.length;
    objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objs[2] = `<< /Type /Pages /Count ${n} /Kids [${this.pages.map((_, i) => (6 + i * 2) + " 0 R").join(" ")}] >>`;
    objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objs[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    objs[5] = `<< /Title (${pdfEnc(title).replace(/[\\()]/g, m => "\\" + m)}) /Producer (Anspar- und Entnahmerechner) >>`;
    this.pages.forEach((c, i) => {
      const s = c.join("\n");
      objs[6 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.W} ${this.H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${7 + i * 2} 0 R >>`;
      objs[7 + i * 2] = `<< /Length ${s.length} >>\nstream\n${s}\nendstream`;
    });
    let out = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"; const off = [];
    for (let k = 1; k < objs.length; k++) { off[k] = out.length; out += `${k} 0 obj\n${objs[k]}\nendobj\n`; }
    const xref = out.length;
    out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + off.slice(1).map(o => String(o).padStart(10, "0") + " 00000 n \n").join("");
    out += `trailer\n<< /Size ${objs.length} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const u = new Uint8Array(out.length); for (let k = 0; k < out.length; k++) u[k] = out.charCodeAt(k) & 255; return u;
  }
}
const PC = { pen: [222, 228, 234], ink: [20, 32, 48], muted: [86, 101, 119], line: [214, 222, 232], acc: [31, 95, 166], band: [210, 224, 240], bad: [185, 58, 44], good: [44, 122, 77], warn: [168, 106, 18], tint: [233, 238, 244] };
function pdfChart(P, x, y, w, h, ages, sr, o) {
  const vals = [].concat(...Object.values(sr).filter(Boolean).map(a => Array.isArray(a[0]) ? [].concat(...a) : a)).filter(isFinite);
  let ymax = Math.max(1, ...vals, o.ref || 0) * 1.05; const step = niceStep(ymax / 4); ymax = Math.ceil(ymax / step) * step;
  const L = 52, B = 18, a0 = ages[0], a1 = ages[ages.length - 1];
  const xs = a => x + L + (a - a0) / Math.max(1, a1 - a0) * (w - L), ys = v => y + (1 - Math.min(Math.max(v, 0), ymax) / ymax) * (h - B);
  for (let v = 0; v <= ymax + 1e-6; v += step) { P.line(x + L, ys(v), x + w, ys(v), { color: PC.line, width: 0.5 }); P.text(x + L - 6, ys(v) + 3, o.fmt(v), { size: 7.5, color: PC.muted, align: "right" }); }
  const span = a1 - a0, tick = span > 30 ? 10 : span > 12 ? 5 : 2;
  for (let a = Math.ceil(a0 / tick) * tick; a <= a1; a += tick) P.text(xs(a), y + h - 4, String(a), { size: 7.5, color: PC.muted, align: "center" });
  if (o.ret != null && o.ret > a0 && o.ret < a1) { P.line(xs(o.ret), y, xs(o.ret), y + h - B, { color: PC.muted, width: 0.6, dash: [2, 2] }); P.text(xs(o.ret) + 3, y + 8, "Entnahme ab " + o.ret, { size: 7.5, color: PC.muted }); }
  const pts = a => a.map((v, i) => [xs(ages[i]), ys(v)]);
  if (sr.area) { const ap = []; sr.area.forEach((v, k) => { if (k && sr.area[k - 1] <= 0 && v > 0) ap.push([xs(ages[k]), ys(0)]); ap.push([xs(ages[k]), ys(v)]); }); P.path(ap.concat([[xs(ages[ages.length - 1]), ys(0)], [xs(ages[0]), ys(0)]]), { fill: PC.pen }); }
  if (sr.band) P.path(pts(sr.band[0]).concat(pts(sr.band[1]).reverse()), { fill: PC.band });
  if (o.ref) { P.line(x + L, ys(o.ref), x + w, ys(o.ref), { color: PC.muted, width: 0.5, dash: [4, 3] }); }
  if (sr.tot) P.path(pts(sr.tot), { stroke: PC.ink, width: 1.2, dash: [5, 3] });
  if (sr.high) P.path(pts(sr.high), { stroke: PC.good, width: 1.1, dash: [1.5, 2] });
  if (sr.low) P.path(pts(sr.low), { stroke: PC.bad, width: 1.1, dash: [4, 2.5] });
  if (sr.mid) P.path(pts(sr.mid), { stroke: PC.acc, width: 1.8 });
  return y + h;
}
function pdfLegend(P, x, y, items) {
  for (const [kind, label] of items) {
    if (kind === "band" || kind === "pen") P.rect(x, y - 6, 14, 7, { fill: kind === "pen" ? PC.pen : PC.band });
    else { const st = { mid: { stroke: PC.acc, width: 1.8 }, low: { stroke: PC.bad, width: 1.1, dash: [4, 2.5] }, high: { stroke: PC.good, width: 1.1, dash: [1.5, 2] }, tot: { stroke: PC.ink, width: 1.2, dash: [5, 3] } }[kind]; P.path([[x, y - 2.5], [x + 14, y - 2.5]], st); }
    P.text(x + 19, y, label, { size: 8, color: PC.muted }); x += 19 + P.tw(label, 8) + 16;
  }
}
const tx = id => ($(id) ? $(id).textContent.trim() : "");
function pdfInputs() {
  const p = last.p, r = last.r, pc = v => nf2.format(Math.round(v * 10000) / 100) + " %", S2 = [];
  const sec = (t, rows) => S2.push([t, rows.filter(Boolean)]);
  sec("Ansparen", [["Alter heute", p.age0 + " Jahre"], GAP && GAP.on && ["Netto heute", eur(GAP.inc0) + " im Monat"], ["Schon angelegt", eur(p.cap) + (p.cap > 0 ? `, davon ${pc(p.gain0)} Gewinn` : "")], ["Sparrate pro Monat", eur(p.contrib) + (p.cg > 0 ? `, steigt um ${pc(p.cg)} pro Jahr` : ", bleibt gleich")]]);
  sec("Entnehmen", [["Zeitraum", `ab ${p.retAge} bis ${p.age1}`], [p.pOn ? "Gewünschtes Netto-Einkommen" : "Entnahme pro Monat", eur(p.net) + " nach Steuern, heutige Kaufkraft"],
    p.extra > 0 && ["Zusätzlich in den aktiven Jahren", `${eur(p.extra)} im Monat bis ${p.xAge}`],
    ["Rate", p.wmode === "dyn" ? `flexibel, ±${S.swing} % pro Jahr, nie unter ${Math.round(p.dfloor * 100)} % (${eur10(p.net * p.dfloor)})` : "fest" + (p.indexed ? ", behält ihre Kaufkraft" : ", bleibt nominal gleich")]]);
  if (p.pOn) { const f = r.pension && r.pension.first; sec("Gesetzliche Rente", [["Rente laut Renteninformation", eur(p.pens) + " brutto, heutige Werte"], ["Rente ab", p.pAge + " Jahren"], ["Steigerung pro Jahr", pc(p.pg)], ["Rentenniveau bei Rentenbeginn", pc(p.pniv) + (Math.abs(p.pniv - 0.48) > 1e-9 ? " (Renteninformation: 48 %)" : "")], ["Steuer auf die Rente", p.ptaxAuto ? `nach Tarif, Tarif steigt ${pc(p.tg)} pro Jahr; im ersten Jahr ${f ? nf1.format(f.rate * 100) + " % auf den steuerpflichtigen Teil" : ""}` : pc(p.ptax) + (ptaxLinked ? " fest, voreingestellt nach Tarif" : " fest, selbst eingetragen")], GAP && GAP.on && ["Rentenlücke schließen", tx("gap-h")], ["Kranken- und Pflegeversicherung", p.kvPriv ? `privat: heute ${eur(p.pkv0)} gesamt${p.ktg ? `, davon ${eur(p.ktg)} fällt mit der Rente weg` : ""}${p.bel ? `, Entlastung ${eur(p.bel)}` : ""}, steigt ${pc(p.pkvg)} pro Jahr. ${tx("pkv-h")}` : `${pc(p.pkv)}, heute ${eur(p.pens * p.pkv)} im Monat${pkvEur != null ? " (selbst eingetragen)" : ""}`], f && ["Netto im ersten Jahr", `${eur10(f.net)} im Monat, heutige Kaufkraft etwa ${eur10(f.net / Math.pow(1 + p.inf, r.pension.PY))}`]]); }
  else sec("Gesetzliche Rente", [["", "nicht einbezogen"]]);
  if (p.rOn) sec("Vermietete Immobilie", [["Marktwert heute", eur(p.rv) + ", ohne Schwankung angenommen"], ["Restschuld heute", eur(p.rdebt)], ["Sollzins", pc(p.rlz) + `, noch ${p.rlzb} Jahre, danach ${pc(p.rlz2)}`], ["Rate pro Monat", eur(p.rrate)], ["Kaltmiete pro Monat", eur(p.rrent) + `, ${pc(p.rvac)} Mietausfall`], ["Eigene Kosten pro Monat", eur(p.rkost)], ["Abschreibung pro Jahr", eur(p.rafaE) + `, bis ${p.rbuyY + 50}`], ["Grenzsteuersatz im Berufsleben", pc(p.rtax)], ["Gerechnet", "nur der Zufluss, ohne Verkauf; Miete und Kosten steigen mit der Inflation"]]);
  if (p.home) sec("Eigenes Haus", [["Restschuld heute", eur(p.debt)], ["Sollzins", pc(p.lz) + `, noch ${p.lzb} Jahre, danach ${pc(p.lz2)}`], ["Rate pro Monat", eur(p.lrate)], ["Dein Anteil an Rate und Sondertilgung", Math.round(p.lshare * 100) + " %"], ["Dein Anteil am Haus", Math.round(p.hshare * 100) + " %"], ["Sondertilgung pro Jahr", eur(p.lsond)], ["Nach Kreditende ins Depot", pc(p.fp)], ["Hauswert heute", eur(p.hv) + (p.hg ? `, ${pc(p.hg)} pro Jahr über der Inflation` : "")], tx("loan-h") && ["Kredit", tx("loan-h")],
    ...p.flows.map(f => ["Einmalzahlung mit " + f.age, f.type === "sale" ? `Hausverkauf${f.label !== "Hausverkauf" ? " (" + f.label + ")" : ""}, ${pc(p.sc)} Verkaufskosten` : `${f.type === "out" ? "Ausgabe" : "Einnahme"} ${eur(f.amt)} (${f.label})`])]);
  else sec("Eigenes Haus", [["", "nicht einbezogen"]]);
  const wB = 1 - p.wE - p.wC - p.wG;
  sec("Aufteilung", [["Aktien / Anleihen / Geldmarkt / Gold", [p.wE, wB, p.wC, p.wG].map(v => Math.round(v * 100) + " %").join(" / ")], ["Anleihezelt", p.tent ? `ja: Aufbau ${p.tUp} Jahre vorher, Aktien zum Rentenbeginn ${Math.round(p.tPeak * 100)} %, Abbau über ${p.tDown} Jahre auf ${Math.round(p.tLate * 100)} %` : "nein"], ["Umschichten ab Abweichung", S.band + " Prozentpunkte"]]);
  sec("Markt", [["Annahmen", SCEN_NAME[S.scen] + (S.model === "s" ? ", einfaches Modell" : ", realistisches Modell")], ["Rendite pro Jahr", `Aktien ${pc(p.re)}, Anleihen ${pc(p.rb)}, Geldmarkt ${pc(p.rc)}` + (p.wG ? `, Gold ${pc(p.rgo)}` : "")], ["Schwankung", `Aktien ${pc(p.ve)}, Anleihen ${pc(p.vb)}`], ["Kosten pro Jahr", pc(p.ter)], ["Inflation", pc(p.inf)],
    ["Härtetest", p.stress === "none" ? "keiner" : `${STRESS[p.stress].name}, ${S.when === "start" ? "gleich zu Beginn" : S.when === "pre5" ? "5 Jahre vor der Entnahme" : "zum Start der Entnahme"}`]]);
  sec("Steuern", [["Sparerpauschbetrag", eur(S.fb)], ["Kirchensteuer", S.ks ? S.ks + " %" : "keine"], ["Verkauf", S.sell === "trick" ? "Zweitdepot-Trick (neueste Anteile zuerst)" : "älteste Anteile zuerst (FIFO)"], ["Basiszins Vorabpauschale", pc(p.bz)]]);
  return S2;
}
function pdfBuild() {
  // Beide Darstellungen erfassen: heutige Kaufkraft und Kontoauszug
  const mode0 = S.mode, snap = m => { S.mode = m; render(); return { k1: tx("k1"), k1s: tx("k1-s"), k2: tx("k2"), k2s: tx("k2-s"), k3: tx("k3"), k3s: tx("k3-s"), k4: tx("k4"), sub: tx("subline"), ch: last.ch, rateh: tx("rate-h") }; };
  const SR = snap("real"), SN = snap("nom"); S.mode = mode0; render();
  const P = new Pdf(), M = 48, CW = P.W - 2 * M, p = last.p, ch = SR.ch, real = true;
  const date = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  let y = 62;
  P.text(M, y, "Anspar- und Entnahmerechner", { size: 20, bold: true }); y += 18;
  P.text(M, y, `Auswertung vom ${date} · Beträge in heutiger Kaufkraft und auf dem Kontoauszug · 2.000 mögliche Zukünfte`, { size: 9.5, color: PC.muted }); y += 26;
  // Urteil
  const sc = Math.round(last.r.success * 100), [cls] = verdictClass(sc), vc = PC[cls];
  P.rect(M, y - 13, P.tw(tx("pill"), 9, true) + 16, 18, { fill: cls === "good" ? [227, 242, 233] : cls === "warn" ? [251, 240, 220] : [251, 229, 225] }); P.text(M + 8, y, tx("pill"), { size: 9, bold: true, color: vc }); y += 24;
  y = P.para(M, y, tx("headline"), CW, { size: 15, bold: true, lh: 19 }) + 2;
  P.rect(M, y - 6, CW, 5, { fill: PC.tint }); P.rect(M, y - 6, CW * sc / 100, 5, { fill: vc }); y += 12;
  y = P.para(M, y, SR.sub, CW, { size: 9.5, color: PC.muted }) + 6;
  if (tx("span-h")) y = P.para(M, y, tx("span-h"), CW, { size: 9.5, bold: true }) + 6;
  y += 8;
  // Kennzahlen als Tabelle: heutige Kaufkraft und Kontoauszug nebeneinander
  P.text(M, y, "Die wichtigsten Zahlen", { size: 12, bold: true }); y += 10;
  const c1 = M + CW * 0.52, c2 = M + CW;
  P.rect(M, y, CW, 20, { fill: PC.tint });
  P.text(M + 10, y + 13.5, "typischer Fall", { size: 8.5, bold: true, color: PC.muted });
  P.text(c1, y + 13.5, "heutige Kaufkraft", { size: 8.5, bold: true, color: PC.muted, align: "right" });
  P.text(c2 - 10, y + 13.5, "auf dem Kontoauszug", { size: 8.5, bold: true, color: PC.muted, align: "right" });
  y += 20;
  [[tx("k1-l"), "k1"], ["Brutto aus dem Depot (1. Jahr, pro Monat)", "k2"], ["Steuern während der Entnahme", "k3"], [tx("k4-l"), "k4"]].forEach(([l, id]) => {
    y += 20; P.text(M + 10, y, l, { size: 10 }); P.text(c1, y, SR[id], { size: 11, bold: true, align: "right" }); P.text(c2 - 10, y, SN[id], { size: 11, bold: true, align: "right", color: PC.acc });
    y += 7; P.line(M, y, M + CW, y, { color: PC.line });
  });
  y += 12;
  y = P.para(M, y, `Vermögen: ${SR.k1s}. Brutto aus dem Depot: ${SR.k2s}. Steuern: ${SR.k3s}.`, CW, { size: 7.5, color: PC.muted, lh: 9.5 }) + 16;
  // Stellschrauben
  const lv = [...document.querySelectorAll("#lev li")].map(li => [li.querySelector("span") ? li.querySelector("span").textContent : "", li.querySelector("b") ? li.querySelector("b").textContent : "", li.querySelector("b") ? li.querySelector("b").className : ""]).filter(l => l[1]);
  if (lv.length) {
    P.text(M, y, tx("lev-t"), { size: 12, bold: true }); y += 8;
    lv.forEach(([a, b, c]) => { P.rect(M, y, CW, 20, { fill: PC.tint }); P.text(M + 10, y + 13.5, a, { size: 9.5 }); P.text(M + CW - 10, y + 13.5, b, { size: 9.5, bold: true, align: "right", color: c === "up" ? PC.good : c === "dn" ? PC.bad : PC.ink }); y += 24; });
    y = P.para(M, y + 6, tx("lev-h"), CW, { size: 8, color: PC.muted });
  }
  // Grafiken: eine Seite in heutiger Kaufkraft, eine auf dem Kontoauszug
  const charts = (c, title, isReal, rateh) => {
    P.add(); y = 62;
    P.text(M, y, title, { size: 14, bold: true }); y += 22;
    P.text(M, y, "So entwickelt sich dein Vermögen", { size: 12, bold: true }); y += 12;
    y = pdfChart(P, M, y, CW, 220, c.ages, { band: [c.Wv.p25, c.Wv.p75], mid: c.Wv.p50, low: c.Wv.p10, tot: c.NW ? c.NW.p50 : null }, { fmt: axisEur, ret: p.retAge }) + 16;
    pdfLegend(P, M, y, [["band", "50 % aller Zukünfte"], ["mid", "typisch"], ["low", "schlecht (10 % sind schlechter)"]].concat(c.NW ? [["tot", "inkl. Haus, abzgl. Restschuld"]] : [])); y += 30;
    if (c.RT) {
      P.text(M, y, tx("rate-t"), { size: 12, bold: true }); y += 12;
      y = pdfChart(P, M, y, CW, 190, c.ra, { area: c.PEN, mid: c.RT.p50, low: c.RT.p10, high: c.RT.p90 }, { fmt: v => nf0.format(v) + " €", ref: isReal ? p.net : 0 }) + 16;
      pdfLegend(P, M, y, [["mid", "typisch"], ["low", "schlecht"], ["high", "gut"]].concat(c.PEN ? [["pen", "davon gesetzliche Rente (netto, typisch)"]] : [])); y += 14;
      y = P.para(M, y, rateh, CW, { size: 8, color: PC.muted }) + 8;
    }
  };
  charts(SR.ch, "In heutiger Kaufkraft", true, SR.rateh);
  charts(SN.ch, "Auf dem Kontoauszug", false, SN.rateh + " Die Beträge sind die Euro des jeweiligen Jahres, also mit der Inflation gewachsen.");
  // Eingaben
  const rows = pdfInputs(), lw = 170;
  const need = rows.reduce((s, [, r]) => s + 22 + r.reduce((t, [, v]) => t + 12 * P.wrap(v, CW - lw, 9).length + 2, 0), 30);
  P.add(); y = 62;
  P.text(M, y, "Deine Eingaben", { size: 12, bold: true }); y += 8;
  for (const [t, rr] of rows) {
    const h = 22 + rr.reduce((s, [, v]) => s + 12 * P.wrap(v, CW - lw, 9).length + 2, 0);
    if (y + h > P.H - 60) { P.add(); y = 62; }
    y += 16; P.text(M, y, t, { size: 9.5, bold: true, color: PC.acc }); P.line(M, y + 4, M + CW, y + 4, { color: PC.line }); y += 4;
    for (const [k, v] of rr) { y += 12; P.text(M, y, k, { size: 9, color: PC.muted }); const ls = P.wrap(v, CW - lw, 9); ls.forEach((l, i) => P.text(M + lw, y + i * 12, l, { size: 9 })); y += 12 * (ls.length - 1) + 2; }
  }
  // Fazit, Rechenweg, Hinweis aus der Seite übernehmen
  const segsOf = el => { const s = []; el.childNodes.forEach(n => { if (n.nodeType === 3) s.push([n.textContent, false]); else if (n.nodeType === 1 && n.tagName !== "UL") s.push([n.textContent, n.tagName === "STRONG" || n.tagName === "B"]); }); return s; };
  const ensure = h => { if (y + h > P.H - 60) { P.add(); y = 62; return true; } return false; };
  const hgt = (segs, w, size) => P.wrap(segs.map(s => s[0]).join(" "), w, size).length * size * 1.4;
  const fz = document.querySelector("details.fazit ol");
  if (fz) {
    P.add(); y = 62; P.text(M, y, "Fazit: Was die Rechnungen zeigen", { size: 12, bold: true }); y += 18;
    [...fz.children].forEach((li, i) => {
      const segs = segsOf(li); ensure(hgt(segs, CW - 16, 9) + 6);
      P.text(M, y, (i + 1) + ".", { size: 9, bold: true }); y = P.rich(M + 16, y, segs, CW - 16, { size: 9 }) + 3;
      li.querySelectorAll(":scope > ul > li").forEach(sl => { const ss = segsOf(sl); ensure(hgt(ss, CW - 30, 8.5) + 4); P.text(M + 18, y, "•", { size: 8.5, color: PC.muted }); y = P.rich(M + 28, y, ss, CW - 30, { size: 8.5, color: PC.muted }) + 2; });
      y += 6;
    });
  }
  const nt = document.querySelector("details.panel.notes:not(.fazit)");
  if (nt) {
    ensure(80); y += 10; P.text(M, y, "Wie wird gerechnet?", { size: 12, bold: true }); y += 18;
    nt.querySelectorAll("p").forEach(pe => {
      const links = pe.querySelectorAll("a");
      if (links.length) {
        ensure(40); P.text(M, y, "Quellen", { size: 9, bold: true }); y += 13;
        links.forEach(a => { const t = a.textContent.trim(), url = a.href; const hh = (P.wrap(t, CW, 8).length + P.wrap(url, CW - 10, 7).length) * 10 + 3; ensure(hh); y = P.para(M, y, t, CW, { size: 8, lh: 10 }); y = P.para(M + 10, y, url, CW - 10, { size: 7, lh: 9.5, color: PC.acc }) + 3; });
        return;
      }
      const segs = segsOf(pe); ensure(hgt(segs, CW, 8.5) + 4); y = P.rich(M, y, segs, CW, { size: 8.5, color: PC.muted }) + 5;
    });
  }
  // Hinweis
  ensure(80); y += 12;
  const disc = "Diese Auswertung ist eine Modellrechnung mit 2.000 zufällig erzeugten Verläufen von Börse und Inflation auf Grundlage der eingestellten Annahmen. Sie ist keine Prognose, keine Anlage-, Steuer- oder Rechtsberatung und ersetzt keine persönliche Beratung. Steuern und Sozialabgaben folgen dem heutigen Recht in vereinfachter Form; künftige Gesetzesänderungen, Kosten der Produkte und persönliche Umstände können das Ergebnis deutlich verändern. Vergangene Renditen sind kein verlässlicher Hinweis auf künftige.";
  const dh = P.wrap(disc, CW - 20, 8.5).length * 12 + 30;
  P.rect(M, y, CW, dh, { fill: PC.tint }); P.text(M + 10, y + 16, "Wichtiger Hinweis", { size: 9.5, bold: true }); P.para(M + 10, y + 30, disc, CW - 20, { size: 8.5, lh: 12, color: PC.muted }); y += dh + 12;

  // Fußzeile
  const n = P.pages.length;
  P.pages.forEach((c, i) => { P.c = c; P.line(M, P.H - 40, P.W - M, P.H - 40, { color: PC.line }); P.text(M, P.H - 28, "Alle Angaben ohne Gewähr · Keine Steuer- oder Anlageberatung", { size: 7.5, color: PC.muted }); P.text(P.W / 2 + 70, P.H - 28, tx("copy"), { size: 7.5, color: PC.muted, align: "center" }); P.text(P.W - M, P.H - 28, `Seite ${i + 1} von ${n}`, { size: 7.5, color: PC.muted, align: "right" }); });
  return P.bytes("Anspar- und Entnahmerechner – Auswertung " + date);
}
let DL = null;
async function pdfSave() {
  const st = $("pdf-s"); st.textContent = "PDF wird erstellt …";
  for (let k = 0; k < 120 && $("lev").classList.contains("busy"); k++) await new Promise(r => setTimeout(r, 100));
  let data; try { data = pdfBuild(); } catch (e) { st.textContent = "Das PDF ließ sich nicht erstellen."; return; }
  const filename = `Anspar-Entnahme-Auswertung-${new Date().toISOString().slice(0, 10)}.pdf`;
  if (DL) {
    try { await DL.save({ filename, data }); st.textContent = "Gespeichert."; }
    catch (e) { const c = e && e.code; st.textContent = c === "declined" ? "Abgebrochen." : c === "rate_limited" ? "Bitte kurz warten und noch einmal versuchen." : c === "host_unavailable" ? "Diese App kann keine Dateien speichern. Öffne den Rechner im Browser." : "Speichern ist hier nicht möglich."; if (["unavailable", "not_granted", "capability_disabled", "capability_removed", "host_unavailable"].includes(c)) $("pdf-b").hidden = true; }
  } else {
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "application/pdf" })); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    st.textContent = "Gespeichert.";
  }
  setTimeout(() => { if (st.textContent !== "PDF wird erstellt …") st.textContent = ""; }, 6000);
}
$("pdf-b").addEventListener("click", pdfSave);
if (window.claude && typeof window.claude.use === "function") window.claude.use("downloads").then(d => { DL = d; $("pdf-b").hidden = !d; }).catch(() => {});
else $("pdf-b").hidden = false;

/* ---------- Ereignisse ---------- */
$("lev").addEventListener("click", e => { const b = e.target.closest(".levbtn"); if (b) applyLever(+b.dataset.li); });
$("lev-ub").addEventListener("click", undoLever);
let raf = 0;
let schedPrev = false;
const schedule = prev => { schedPrev = prev === true; cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setTimeout(() => run(schedPrev), 0)); };
let lateLinked = true;
$("tLate").addEventListener("input", () => { lateLinked = false; });
$("tLate-n").addEventListener("change", () => { lateLinked = false; });
const followLate = () => { if (lateLinked) setV("tLate", Math.min(gv("wE"), 100 - gv("wC") - gv("wG"))); };
$("wE").addEventListener("input", followLate); $("wE-n").addEventListener("change", followLate);
ranges.forEach(id => $(id).addEventListener("input", () => { delete NUMV[id]; if (["re", "rb", "rc", "ve", "vb", "inf"].includes(id)) matchScen(); schedule(true); }));
ranges.forEach(id => $(id).addEventListener("change", () => schedule()));
Object.entries(NUMCFG).forEach(([id, c]) => {
  const el = $(id + "-n"), rg = $(id);
  const commit = () => {
    let x = parseNum(el.value);
    if (!isFinite(x)) { showNum(id); return; }
    const f = Math.pow(10, c.d); x = Math.round(x * f) / f;
    x = Math.max(+rg.min, Math.min(c.soft || +rg.max, x));
    if (c.soft) rg.max = Math.max(ORIGMAX[id], x);
    setV(id, x); el.value = fmtN(id, x);
    if (["re", "rb", "rc", "ve", "vb", "inf"].includes(id)) matchScen();
    schedule();
  };
  el.addEventListener("change", commit);
  el.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); commit(); el.blur(); } });
  el.addEventListener("focus", () => el.select());
});
$("pkv").addEventListener("input", () => { pkvEur = null; syncPkv(); });
$("pAge").addEventListener("input", () => { pAgeWant = +$("pAge").value; });
$("pAge-n").addEventListener("change", () => { pAgeWant = gv("pAge"); });
$("ptax").addEventListener("input", () => { ptaxLinked = false; });
$("ptax-n").addEventListener("change", () => { ptaxLinked = false; syncPtax(); });
$("pkv-n").addEventListener("change", () => { pkvEur = null; syncPkv(); });
$("pens").addEventListener("input", syncPkv); $("pens-n").addEventListener("change", syncPkv);
{ const el = $("pkvE");
  const commit = () => { const x = parseNum(el.value); if (isFinite(x) && x >= 0) { pkvEur = Math.round(x); } syncPkv(); showNum("pkv"); schedule(); };
  el.setAttribute("aria-label", "Kranken- und Pflegeversicherung in Euro pro Monat");
  el.addEventListener("change", commit); el.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); commit(); el.blur(); } }); el.addEventListener("focus", () => el.select()); }
["idx", "tent", "flowsOn", "pOn", "gapOn"].forEach(id => $(id).addEventListener("change", schedule));
$("home").addEventListener("change", schedule);
$("rOn").addEventListener("change", schedule);
$("bz").addEventListener("input", syncAll); $("bz-n").addEventListener("change", syncAll);
[1, 2, 3].forEach(n => {
  $(`f${n}-t`).addEventListener("change", schedule);
  ["a", "v", "l"].forEach(k => { const el = $(`f${n}-${k}`); el.addEventListener("change", () => { if (k === "v") { const x = parseNum(el.value); if (isFinite(x)) el.value = nf0.format(Math.max(0, x)); } schedule(); }); el.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); el.blur(); } }); });
});
const bind = (attr, fn) => document.querySelectorAll(`[data-${attr}]`).forEach(b => b.addEventListener("click", () => { fn(b.dataset[attr]); syncAll(); schedule(); }));
bind("wmode", v => { S.wmode = v; });
bind("ptm", v => { S.ptm = v; syncPtax(); });
bind("kvm", v => { S.kvm = v; });
bind("swing", v => { S.swing = +v; });
bind("band", v => { S.band = +v; });
bind("fb", v => { S.fb = +v; });
bind("ks", v => { S.ks = +v; });
bind("sell", v => { S.sell = v; });
bind("model", v => { S.model = v; });
bind("stress", v => { S.stress = v; });
bind("when", v => { S.when = v; });
document.querySelectorAll("[data-scen]").forEach(b => b.addEventListener("click", () => {
  if (b.dataset.scen === "e") { $("sec-markt").open = true; $("adv-d").open = true; setScen("e"); syncAll(); $("re-n").focus(); return; }
  setScen(b.dataset.scen); schedule();
}));
const setMode = m => { S.mode = m; $("m-real").setAttribute("aria-pressed", String(m === "real")); $("m-nom").setAttribute("aria-pressed", String(m === "nom")); render(); };
$("m-real").addEventListener("click", () => setMode("real"));
$("m-nom").addEventListener("click", () => setMode("nom"));
$("reset").addEventListener("click", () => {
  Object.keys(NUMV).forEach(k => delete NUMV[k]); pkvEur = null; ptaxLinked = true; pAgeWant = DEFAULTS.pAge;
  $("sec-haus").open = false;
  lateLinked = true;
  [1, 2, 3].forEach(n => { $(`f${n}-t`).value = ""; ["a", "v", "l"].forEach(k => { $(`f${n}-${k}`).value = ""; }); });
  Object.entries(ORIGMAX).forEach(([k, m]) => { $(k).max = m; });
  Object.entries(DEFAULTS).forEach(([k, v]) => { const el = $(k); if (el.type === "checkbox") el.checked = v; else el.value = v; });
  Object.assign(S, { kvm: "gkv", ptm: "fix", wmode: "fix", swing: 10, band: 5, fb: 1000, ks: 0, sell: "fifo", model: "r", stress: "none", when: "ret" });
  setScen(SCEN0); syncAll(); schedule();
});
let rz = 0; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => last && render(), 150); });

setScen(SCEN0); syncAll(); run();

/* ---------- Klickstrecke ---------- */
if ($("wiz")) {
  const NSTEP = 8, moved = [];
  let step = 1, view = "quick";
  try { view = localStorage.getItem("aer-view2") || "quick"; } catch (e) {}
  // Elemente des ausführlichen Rechners werden in die Schritte verschoben und beim Zurückschalten wieder an ihren Platz gestellt
  const pick = k => k === "%kpihead" ? $("m-real").closest(".card-head") : k === "%kpis" ? document.querySelector(".kpis") : k[0] === "#" ? $(k.slice(1)) : k[0] === "@" ? document.querySelector(`[data-${k.slice(1)}]`).closest(".ctl")
    : k[0] === "§" ? (k === "§verdict" ? document.querySelector(".verdict") : k === "§fazit" ? document.querySelector("details.fazit") : k === "§notes" ? document.querySelector("details.panel.notes:not(.fazit)") : $(k.slice(1)).closest(".panel")) : $(k).closest(".ctl");
  function mount(root) {
    document.querySelectorAll(root + " [data-els]").forEach(box => box.dataset.els.split(",").forEach(k => {
      const el = pick(k), ph = document.createComment("wz"); el.before(ph); moved.push([el, ph]); box.appendChild(el);
    }));
  }
  function unmount() { moved.splice(0).forEach(([el, ph]) => { ph.replaceWith(el); }); }
  const PROF = [30, 60, 90], LBL = ["Heute", "Entnahme", "Gesetzliche Rente", "Einkommen", "Haus", "Anlage", "Härtetest", "Ergebnis"];
  function syncWiz() {
    $("wz-n").textContent = step < NSTEP ? `Schritt ${step} von ${NSTEP - 1} · ${LBL[step - 1]}` : "Ergebnis";
    document.querySelectorAll("#wiz [data-go]").forEach(b => { const n = +b.dataset.go; b.classList.toggle("done", n < step); if (n === step) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
    $("wz-dyn").hidden = S.wmode !== "dyn";
    document.querySelectorAll("#wiz .wz-step").forEach(s => { s.hidden = +s.dataset.step !== step; });
    document.querySelectorAll("#wiz [data-yn]").forEach(g => { const on = $(g.dataset.yn).checked; g.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String((b.dataset.v === "1") === on))); });
    document.querySelectorAll("#wiz [data-if]").forEach(e => { e.hidden = !$(e.dataset.if).checked; });
    const pOn = $("pOn").checked;
    { const pg = gv("pg"), nv = gv("pniv");
      document.querySelectorAll("[data-wpg]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.wpg === pg)));
      document.querySelectorAll("[data-wniv]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.wniv === nv)));
      $("wpg-h").textContent = [0, 2, 3].includes(pg) ? (pg === 0 ? "Die Rente steigt nie. Bei 2 % Inflation verliert sie jedes Jahr an Kaufkraft, ein harter Test für deinen Plan." : pg === 2 ? "Die Rente behält ihre Kaufkraft, wenn die Inflation bei 2 % liegt." : "Die Rente wächst wie die Löhne und damit etwas schneller als die Preise.") : `Eigener Wert aus der ausführlichen Ansicht: ${nf2.format(pg)} %.`;
      $("wniv-h").textContent = [48, 46, 44, 43, 40].includes(nv) ? ({ 48: "Wie heute; damit rechnet auch die Renteninformation.", 46: "Prognose der Rentenversicherung für 2040.", 44: "Eine vernünftige Mitte für einen Rentenbeginn um 2057 nach heutigem Recht.", 43: "Vorsichtig, etwa wenn das Rentenalter an die Lebenserwartung gekoppelt wird.", 40: "Härtetest: Rentenalter bleibt bei 67, keine Gegenmaßnahmen bis 2070." }[nv] + (nv === 48 ? "" : ` Die Rente fällt etwa ${Math.round((1 - nv / 48) * 100)}\u00a0% niedriger aus als laut Renteninformation.`)) : `Eigener Wert aus der ausführlichen Ansicht: ${nf1.format(nv)} %.`; }
    { $("wz-pkv").hidden = S.kvm !== "pkv"; const g = gv("pkvg");
      document.querySelectorAll("[data-wpkvg]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.wpkvg === g)));
      $("wpk-h").textContent = { 2.5: "Günstiger Verlauf, etwa bei einem stabilen Tarif.", 3.5: "Etwa der Schnitt der Branche von 2006 bis 2026 (3,4 % pro Jahr).", 4.5: "Vorsichtig: dein Tarif wird teurer als der Schnitt." }[g] || `Eigener Wert aus der ausführlichen Ansicht: ${nf2.format(g)} %.`;
      if (gv("bel") > 0) $("wpk-h").textContent += ` Beitragsentlastung ${eur(gv("bel"))} aus der ausführlichen Ansicht ist eingerechnet.`; }
    $("wz-pa-h").textContent = `Im Hintergrund: Rente ab ${gv("pAge")}${gv("retAge") > pAgeWant ? ", weil die Entnahme erst dann beginnt; Zuschläge für den späteren Rentenbeginn sind nicht eingerechnet" : ""}. Ändern kannst du das in der ausführlichen Ansicht.`;
    const gapOn = $("gapOn").checked;
    $("wz-net-t").textContent = gapOn ? "Dein Ziel im Alter" : pOn ? "Wie viel Netto-Einkommen möchtest du im Alter?" : "Wie viel soll das Depot im Monat liefern?";
    $("wz-net-l").textContent = gapOn ? "Aus deinem heutigen Netto und dem Anteil aus Schritt 3 berechnet, in heutiger Kaufkraft. Für die aktiven Jahre kannst du hier noch mehr einplanen." : pOn ? "Rente und Depot zusammen, nach Steuern und in heutiger Kaufkraft. Das Depot zahlt nur die Lücke." : "Zusätzlich zu einer Rente, nach Steuern und in heutiger Kaufkraft.";
    const wE = gv("wE"), std = gv("wC") === 5 && gv("wG") === 0 && !$("tent").checked && PROF.includes(wE);
    $("wz-prof").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(std && +b.dataset.p === wE)));
    $("wz-prof-h").textContent = std ? "" : `Gerade eingestellt: ${wE} % Aktien, ${gv("wC")} % Geldmarkt${gv("wG") ? `, ${gv("wG")} % Gold` : ""}${$("tent").checked ? ", mit Anleihezelt" : ""}. Ein Klick auf ein Profil ersetzt das.`;
    $("wz-back").hidden = step === 1; $("wz-full").hidden = step !== NSTEP;
    $("wz-next").textContent = step === NSTEP - 1 ? "Ergebnis zeigen" : step === NSTEP ? "Von vorn" : "Weiter";
    if (step === NSTEP) { const extra = []; if (S.scen !== "o") extra.push(`Markt „${SCEN_NAME[S.scen]}“`); if (S.stress !== "none") extra.push(`Härtetest „${STRESS[S.stress].name}“`); if (S.sell === "trick") extra.push("Zweitdepot-Trick");
      $("wz-ass").textContent = `Gerechnet mit ${extra.length ? extra.join(", ") : "den Marktannahmen „Wie früher“"}, deutschen Steuern wie im echten Depot und 2.000 möglichen Zukünften. Feinheiten wie Steuern, Gold, Anleihezelt oder Einmalzahlungen stellst du unter „Alle Einstellungen“ ein.`; }
  }
  function go(n) {
    step = Math.max(1, Math.min(NSTEP, n)); syncWiz();
    schedule();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function setView(v) {
    view = v; VIEWNOW = v; try { localStorage.setItem("aer-view2", v); } catch (e) {}
    document.querySelectorAll("[data-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === v)));
    unmount(); $("wiz").hidden = v !== "easy"; $("qk").hidden = v !== "quick"; document.querySelector(".grid").hidden = v !== "full";
    if (v === "easy") { mount("#wiz"); syncWiz(); }
    if (v === "quick") { mount("#qk"); syncQk(); }
    if (last) { render(); if (v === "quick") startSide(last.p); }
    updBar();
  }
  document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
  document.querySelectorAll("#wiz [data-yn] button").forEach(b => b.addEventListener("click", () => { $(b.closest("[data-yn]").dataset.yn).checked = b.dataset.v === "1"; syncWiz(); schedule(); }));
  $("wz-prof").querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    setV("wE", +b.dataset.p); setV("wC", 5); setV("wG", 0); $("tent").checked = false; followLate(); syncWiz(); schedule();
  }));
  document.querySelectorAll("#wiz [data-go]").forEach(b => b.addEventListener("click", () => go(+b.dataset.go)));
  document.querySelectorAll("[data-wpkvg]").forEach(b => b.addEventListener("click", () => { setV("pkvg", +b.dataset.wpkvg); showNum("pkvg"); syncWiz(); schedule(); }));
  document.querySelectorAll("[data-kvm]").forEach(b => b.addEventListener("click", () => { if (view === "easy") setTimeout(syncWiz, 0); if (view === "quick") setTimeout(syncQk, 0); }));
  document.querySelectorAll("[data-wpg]").forEach(b => b.addEventListener("click", () => { setV("pg", +b.dataset.wpg); showNum("pg"); syncWiz(); schedule(); }));
  document.querySelectorAll("[data-wniv]").forEach(b => b.addEventListener("click", () => { setV("pniv", +b.dataset.wniv); showNum("pniv"); syncWiz(); schedule(); }));
  document.querySelectorAll("[data-wmode],[data-scen],[data-stress],[data-when]").forEach(b => b.addEventListener("click", () => { if (view === "easy") syncWiz(); if (view === "quick") syncQk(); }));
  $("wz-next").addEventListener("click", () => go(step === NSTEP ? 1 : step + 1));
  $("wz-back").addEventListener("click", () => go(step - 1));
  $("wz-full").addEventListener("click", () => setView("full"));
  $("reset").addEventListener("click", () => setTimeout(() => { if (view === "easy") syncWiz(); if (view === "quick") syncQk(); }, 0));

  /* ---------- Schnellcheck: dieselben Werte, nur das Wichtigste sichtbar ---------- */
  let qs = 1; const QN = 5, QL = ["Heute", "Rente", "Haus", "Plan", "Ergebnis"];
  const pf0 = x => nf1.format(Math.round(x * 1000) / 10).replace(/,0$/, "") + "\u00a0%";
  function syncQk() {
    $("qk-n").textContent = qs < QN ? `Schritt ${qs} von ${QN - 1} · ${QL[qs - 1]}` : "Ergebnis";
    document.querySelectorAll("#qk [data-qgo]").forEach(b => { const n = +b.dataset.qgo; b.classList.toggle("done", n < qs); if (n === qs) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); });
    document.querySelectorAll("#qk .qk-step").forEach(s => { s.hidden = +s.dataset.qstep !== qs; });
    document.querySelectorAll("#qk [data-yn]").forEach(g => { const on = $(g.dataset.yn).checked; g.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String((b.dataset.v === "1") === on))); });
    document.querySelectorAll("#qk [data-qif]").forEach(e => { e.hidden = !$(e.dataset.qif).checked; });
    document.querySelectorAll("#qk [data-qkv]").forEach(e => { e.hidden = S.kvm !== "pkv"; });
    const nv = gv("pniv");
    document.querySelectorAll("[data-qniv]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.qniv === nv)));
    $("qniv-h").textContent = ([48, 44, 40].includes(nv) ? { 48: "Wie heute; damit rechnet auch die Renteninformation.", 44: "Vernünftige Mitte für einen Rentenbeginn in 20 bis 30 Jahren.", 40: "Vorsichtig: keine Gegenmaßnahmen bis 2070." }[nv] : `Eigener Wert: ${nf1.format(nv)} %.`) + (nv < 48 ? ` Die Rente fällt etwa ${Math.round((1 - nv / 48) * 100)}\u00a0% niedriger aus als laut Renteninformation.` : "");
    $("qra-h").textContent = $("pOn").checked ? (gv("pAge") > gv("retAge") ? `Bis zur gesetzlichen Rente mit ${gv("pAge")} zahlt das Depot allein.` : `Die gesetzliche Rente beginnt mit ${gv("pAge")}.`) : "";
    const gp = gv("gapPct"), gon = $("gapOn").checked;
    document.querySelectorAll("[data-qgap]").forEach(b => b.setAttribute("aria-pressed", String(gon && +b.dataset.qgap === gp)));
    $("qgap-h").textContent = gon && GAP ? `Ziel: ${eur(GAP.target)} im Monat in heutiger Kaufkraft (Netto ${eur(GAP.inc0)}${GAP.sav ? ` ohne Sparrate` : ""}${GAP.loan ? ` und ohne Kreditrate, weil der Kredit vorher abbezahlt ist` : ""}, mal ${gp} %).` + ([100, 120, 150].includes(gp) ? "" : " Eigener Anteil aus der ausführlichen Ansicht.")
      : `Bisher rechnest du mit festen ${eur(gv("net"))} im Monat. Ein Klick rechnet stattdessen vom heutigen Netto aus.`;
    document.querySelectorAll("[data-qwm]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.qwm === S.wmode)));
    $("qwm-h").textContent = S.wmode === "dyn" ? `Nach schlechten Jahren sinkt die Rate um höchstens 10 % pro Jahr, aber nie unter ${Math.round(gv("dfloor"))} % vom Ziel. Das macht den Plan deutlich sicherer.` : "Die Rate bleibt immer gleich hoch, auch nach einem Crash.";
    const wE = gv("wE"), std = gv("wC") === 5 && gv("wG") === 0 && !$("tent").checked && PROF.includes(wE);
    $("qk-prof").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(std && +b.dataset.qp === wE)));
    $("qp-h").textContent = std ? "Der Rest liegt in Anleihen und 5 % im Geldmarkt." : `Gerade eingestellt: ${wE} % Aktien, ${gv("wC")} % Geldmarkt${gv("wG") ? `, ${gv("wG")} % Gold` : ""}${$("tent").checked ? ", mit Anleihezelt" : ""}. Ein Klick auf ein Profil ersetzt das.`;
    $("qk-back").hidden = qs === 1; $("qk-full").hidden = qs !== QN;
    $("qk-next").textContent = qs === QN - 1 ? "Ergebnis zeigen" : qs === QN ? "Von vorn" : "Weiter";
    if (qs === QN) qkResult();
  }
  function qkResult() {
    if (!last) return; const { p, r } = last, alt = last.cmp && last.cmp.alt;
    const cur = r.success, oth = alt ? alt.success : null, normal = S.scen === "v" ? oth : cur, vors = S.scen === "v" ? cur : oth;
    const tile = (lab, sub, x) => { if (x == null) return `<div class="qk-t"><span class="l">${lab}</span><b>…</b><span class="s">${sub}</span></div>`; const sc = Math.round(x * 100), [cls] = verdictClass(sc); return `<div class="qk-t ${cls}"><span class="l">${lab}</span><b>${succTxt(x).replace("etwa ", "≈\u00a0").replace(" %", "\u00a0%")}</b><span class="s">${sub}</span></div>`; };
    const own = S.scen === "o" || S.scen === "v";
    let h = `<h2>Beide Märkte im Vergleich</h2><div class="qk-two">` + (own ? tile("Normal", "Börse wie früher", normal) + tile("Vorsichtig", "Börse eher schwach", vors) : tile("Deine Annahmen", "aus der ausführlichen Ansicht", cur) + tile("Vorsichtig", "Börse eher schwach", oth)) + `</div>`;
    h += `<p>So oft reicht das Geld bis ${p.age1}. Ergebnis, Stellschrauben und Diagramme rechnen mit „${own ? (S.scen === "v" ? "Vorsichtig" : "Normal") : "deinen Annahmen"}“.</p>`;
    $("qk-res").innerHTML = h;
    $("qk-ass").textContent = `Fest im Hintergrund, änderbar unter „Ausführlich“: Rente steigt ${pf0(p.pg)} pro Jahr${p.kvPriv ? `, PKV ${pf0(p.pkvg)}` : ""}, beides bei ${pf0(0.02)} Inflation; Inflation ${pf0(p.inf)}, Kosten ${pf0(p.ter)}, Planung bis ${p.age1}${p.home && p.debt > 0 ? `, Zins nach der Zinsbindung ${pf0(p.lz2)}` : ""}, Steuer ${p.ptaxAuto ? "nach Tarif" : "mit " + pf0(p.ptax) + " auf die Rente"}${p.home ? ", die Hälfte der frei werdenden Kreditrate wird gespart".replace("die Hälfte", p.fp === 0.5 ? "die Hälfte" : pf0(p.fp)) : ""}${p.rOn ? `; vermietete Immobilie nur als Zufluss, ohne Verkauf: ${pf0(p.rlz)} Zins für ${p.rlzb} Jahre, danach ${pf0(p.rlz2)}, eigene Kosten ${eur(p.rkost)} im Monat, Mietausfall ${pf0(p.rvac)}, Miete und Kosten steigen mit der Inflation, Abschreibung ${eur(p.rafaE)} pro Jahr, Grenzsteuersatz ${pf0(p.rtax)}` : ""}. Gerechnet mit 2.000 möglichen Zukünften und deutschen Steuern wie im echten Depot. Modellrechnung, keine Prognose und keine Anlage-, Steuer- oder Rechtsberatung.`;
  }
  hookRender = () => { if (view === "quick") syncQk(); };
  function qgo(n) { qs = Math.max(1, Math.min(QN, n)); syncQk(); schedule(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  document.querySelectorAll("#qk [data-qgo]").forEach(b => b.addEventListener("click", () => qgo(+b.dataset.qgo)));
  $("qk-next").addEventListener("click", () => qgo(qs === QN ? 1 : qs + 1));
  $("qk-back").addEventListener("click", () => qgo(qs - 1));
  $("qk-full").addEventListener("click", () => setView("full"));
  document.querySelectorAll("#qk [data-yn] button").forEach(b => b.addEventListener("click", () => { const c = $(b.closest("[data-yn]").dataset.yn); c.checked = b.dataset.v === "1"; c.dispatchEvent(new Event("change", { bubbles: true })); syncAll(); syncQk(); schedule(); }));
  document.querySelectorAll("[data-qniv]").forEach(b => b.addEventListener("click", () => { setV("pniv", +b.dataset.qniv); showNum("pniv"); syncAll(); syncQk(); schedule(); }));
  document.querySelectorAll("[data-qgap]").forEach(b => b.addEventListener("click", () => { $("gapOn").checked = true; setV("gapPct", +b.dataset.qgap); showNum("gapPct"); syncAll(); syncQk(); schedule(); }));
  document.querySelectorAll("[data-qwm]").forEach(b => b.addEventListener("click", () => { const t = document.querySelector(`[data-wmode="${b.dataset.qwm}"]`); if (t) t.click(); syncQk(); schedule(); }));
  $("qk-prof").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { setV("wE", +b.dataset.qp); setV("wC", 5); setV("wG", 0); $("tent").checked = false; followLate(); syncQk(); schedule(); }));
  setView(view);
}
}
</script>
</body>
</html>
