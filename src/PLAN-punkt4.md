# Plan Punkt 4: Ansicht „Einfach“ abschaffen, „Schnell“ ausbauen

Stand 27.11.2026. Noch nichts davon umgesetzt.

## Ziel
- Oben nur noch „Schnell“ und „Ausführlich“. `#wiz`, `#wz-pre` und der Code für „Einfach“ (`syncWiz`, `go`, Handler `data-wpg`/`data-wniv`/`data-wpkvg`, Abfragen auf `"easy"`) entfallen.
- Gespeichertes „easy“ wird zu „quick“ und gleich zurückgeschrieben. Drei Schlüssel: `aer-view2` (persönlich), `aer-view-demo2` (Beispiel), `aer-app-view2` (App).
- Jeder Schnell-Schritt bekommt ein zugeklapptes `<details>` „Mehr Angaben“. Die Felder kommen wie bisher über `data-els` hinein. Die Summary zeigt zugeklappt die aktuellen Werte, z. B. „bis 95 · Kosten 0,3 % · Mindestrate 75 %“.

## Entschieden
1. Die Börsenwahl kommt ins Ergebnis. `@scen` fliegt aus dem Plan-Schritt. Die Kacheln „Normal / Vorsichtig“ in `#qk-res` werden antippbar (`setScen`, `aria-pressed`). Bei eigenen Renditen aus „Ausführlich“ (`S.scen` weder `o` noch `v`) werden die eigenen Werte nicht überschrieben, es wird nur umgeschaltet, welche Zahl gilt. Dafür einen eigenen Test schreiben.
2. Beispielversion und App starten mit „100 % vom heutigen Netto“ (`gapOn: true` in DEFAULTS und `checked` in part1.html). `build.py` setzt `checked` per Ersetzung und bricht ab, wenn es schon gesetzt ist: die Ersetzung muss idempotent werden. Danach das Beispielergebnis auf Plausibilität prüfen (inc0 2.600 €).
3. „Planung bis“ (`age1`) steht unter „Plan → Mehr Angaben“. Es bleibt sichtbar über die Summary und die Hauptaussage („reicht bis 95“).

## Schritte
| Schritt | Sichtbar | Mehr Angaben |
|---|---|---|
| Heute | age0, inc0, cap, contrib | cg |
| Rente | pOn, pens, Rentenniveau 48/44/40, kvm; bei PKV: ppkv0, ktg, **PKV-Steigerung 2,5/3,5/4,5 %** (Knöpfe) und `#pkv-h` | Steuer auf die Rente: `@ptm` + `tg` (Tarif) bzw. `ptax` (eigener Satz); Rentensteigerung 0/2/3 % (Knöpfe); bei GKV `pkv` |
| Haus/Miete | wie bisher | Haus: lz2, hv, hshare. Miete (nur bei rOn): rlz, rlzb, rkost, rtax. Je ein eigenes „Mehr Angaben“ |
| Plan | retAge, Ziel „100 % · 120 % · 150 % · Fester Betrag“ (bei „Fester Betrag“: gapOn aus, Regler `net`), fest/flexibel, Anlageprofil | age1, xtra, xAge, ter, dfloor (nur bei „flexibel“) |
| Ergebnis | Urteil, Kennzahlen, danach Block „Was, wenn die Börse schlecht läuft?“: antippbare Kacheln + zugeklappter Härtetest `#stress-p` (Summary zeigt „Kein Test“ bzw. den aktiven Test). Danach Stellschrauben, Diagramme, Fazit | – |

## Härtetest
- Ein aktiver Test bekommt am Urteil ein deutliches Band „Mit Härtetest: …“ mit dem Knopf „Test beenden“, und die Kacheln tragen denselben Hinweis. Das ist wichtig, weil `cmp.alt` nur den Markt ändert: der Test steckt in beiden Kacheln. Außerdem speichert die App `S.stress` mit.
- Inflation im selben Block einstellbar: Knöpfe „2 % · 3 % · 4 %“ setzen den Regler `inf` (Ausführlich, Markt → „Renditen, Schwankung, Inflation“). Ein eigener Wert erscheint als „Eigener Wert: x %“. Ein Hinweis erklärt, was mitsteigt (Zinsen, Rente, PKV, Sparrate, Aktien zu drei Vierteln) und was schadet (Steuer auf Scheingewinne, fester Sparerpauschbetrag). Steht die Inflation nicht auf 2 %, nennt das Band am Urteil das mit („Mit 4 % Inflation“). In `qk-ass` fällt die Inflation dann weg. Im Test zusätzlich prüfen: die Knöpfe setzen `inf` und das Ergebnis rechnet neu.
- Den Satz „Für den Anfang reichen …“ ersetzt `build.py` (assert n == 1). Er zieht mit in den Ergebnis-Block, die Ersetzung in `build.py` muss nachgezogen werden.

## Weitere Anpassungen
- Den Hinweis zu `inc0` anpassen: Er verweist auf „Rentenlücke schließen unter Gesetzliche Rente“, das gibt es in „Schnell“ nicht.
- In `qk-ass` nur noch nennen, was nicht einstellbar ist: Sparanteil der frei werdenden Kreditrate, Mietausfall, Abschreibung.
- `build_demo.py` sucht `toggle viewsw three` und muss auf zwei Knöpfe umgestellt werden (CSS `.viewsw.three`).
- `renderSpan` und `updBar` prüfen `VIEWNOW`; nach dem Umbau gibt es nur noch `quick`/`full`.

## Tests und Veröffentlichung
- `tests/rui.py` und `tests/rui_demo.py` klicken auf `[data-view=easy]` und müssen neu geschrieben werden. Sie prüfen: „Mehr Angaben“ je Schritt, PKV-Knöpfe, „Fester Betrag“, antippbare Kacheln, Härtetest mit Band und „Test beenden“, Umleitung von „easy“ und keine JS-Fehler.
- Die Node-Tests laufen unverändert, der Rechenkern bleibt gleich.
- Danach alle drei Versionen bauen, testen, beide Artefakte veröffentlichen und `app/index.html` und `app/sw.js` in den Hauptordner kopieren und pushen. Berichte nicht anfassen.
- `mine.json` fehlt in neuen Sitzungen: Erzeugen durch Vergleich von `DEFAULTS` und `const S` im persönlichen Artefakt mit `ui.js`.
