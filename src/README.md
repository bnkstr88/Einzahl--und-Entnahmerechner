# Quellcode des Anspar- und Entnahmerechners

Hier liegt der Quellcode. Die fertige App im Hauptordner (`index.html`, `sw.js`) wird daraus gebaut.

## Dateien
- `engine.js`: Rechenkern mit Monte Carlo (2.000 Zukünfte), Steuern, Rente, Krediten, Zinspfad und Vermietung
- `ui.js`: Oberfläche, PDF-Export und Sterbetafel
- `part1.html`: HTML und CSS
- `build_demo.py`: baut `rechner-beispiel.html`, die Beispielversion mit erfundenen Werten
- `build_app.py`: baut `app/` aus der Beispielversion, also die PWA mit Speicherung auf dem Gerät und Service Worker
- `build.py`: baut `anspar-entnahme-rechner.html`, die persönliche Version. Sie braucht `mine.json` (siehe unten).
- `tests/`: Robustheitstests (Node) und Oberflächentests (Playwright). Die Tests in Node brauchen `tests/params.json`.

## Bauen
```
cd src
python3 build_demo.py && python3 build_app.py      # Beispiel und App
python3 build.py                                    # persönliche Version (braucht mine.json)
cp app/index.html app/sw.js ..                      # App veröffentlichen (GitHub Pages)
```

## Nicht im Repository (persönliche Werte)
- `mine.json`: persönliche Standardwerte im Format `{"MINE_VAL": {...}, "MINE_CHK": {...}, "MINE_S": {...}}`. Die Werte stehen in der veröffentlichten persönlichen Version: dort in den `value`-Attributen und `DEFAULTS`.
- `tests/params.json`: ein Parametersatz für die Node-Tests. Er wird im Browser mit `JSON.stringify(readParams())` erzeugt.

## Veröffentlichung
- Persönliche Version: Claude-Artefakt `da26bc4f-a9c4-464f-ae19-012aa19ae368`
- Beispielversion: Claude-Artefakt `8c10d984-12c0-4d66-ae17-bd0284476329`
- App: GitHub Pages aus diesem Repository (Hauptordner)
- Bericht „Wie gerechnet wird“: Claude-Dokument und eine Kopie in Google Docs. Beide werden nur auf ausdrücklichen Wunsch aktualisiert.
