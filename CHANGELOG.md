# Änderungsprotokoll

## 2026-10-14 – v1.0

Tee-Sommelier ist live.

- Gebaute statische Dateien im Root von `main`, Basispfad `/`
- Workflow baut bei Push auf `main` und committet das Ergebnis an die von GitHub Pages ausgelieferte Stelle
- `CNAME` mit `tee.yoursidequest.org`, `.nojekyll` bleibt
- `/legacy` bleibt erreichbar
- Status: live

## 2026-10-13 – v1.0-preview

Erste öffentliche Vorschau des Tee-Sommeliers.

- Geschmack und Tageszeit, regelbasierte Empfehlung von 1–3 Tees aus einem lokalen Datensatz (29 Tees)
- Kurze Begründung, Zubereitung (Temperatur, Ziehzeit, Menge) und Koffeingehalt als Fakt
- Impressum und Datenschutz mit Maximilian Hillert, Illgnerstraße 35, 04442 Zwenkau, maximilianhillert@mail.grokbot.com als Anbieter und verantwortliche Stelle
- Kein Shop, kein Backend, keine Cookies, kein Tracking, keine Gesundheits- oder Heilaussagen
- Alter Clickdummy und das frühere Formular liegen unter `legacy/`
- GitHub-Pages-Workflow nur per `workflow_dispatch`
- Status: Vorschau, nicht live
