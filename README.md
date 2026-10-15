# Tee-Sommelier

Geschmacksempfehlung für Tee, direkt im Browser. Du wählst eine oder mehrere Richtungen (herb, fruchtig, blumig, erdig, mild, kräftig) und eine Tageszeit (Morgen, Mittag, Nachmittag, Abend). Die App schlägt ein bis drei Tees vor – mit kurzer Begründung, Zubereitung (Temperatur, Ziehzeit, Menge) und Koffeingehalt als Fakt.

Die Vorschläge kommen aus festen Regeln und einem lokalen Datensatz mit 29 gängigen Tees. Es gibt kein Backend und keine eigenen Produkte. Jede Empfehlung hat einen Link „Hier kaufen“ auf eine Amazon-Suche ohne Partner-ID (`src/affiliate.json`). Vercel Web Analytics erfasst Seitenaufrufe und den Klick darauf ohne Cookies. Schriftarten kommen aus dieser Seite.

**Status: live auf tee.yoursidequest.org (Vercel)**

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm run dev
```

Der Entwicklungsserver zeigt die App im Browser. Produktionsbau und Vorschau der statischen Dateien:

```bash
npm test
npm run build
npm run preview
```

`npm run build` schreibt nach `dist/`. Diese Dateien sind die Website (Start, Impressum, Datenschutz).

## Empfehlung

Jeder Tee hat Geschmacksgewichte, eine Passung zur Tageszeit und einen Koffeingehalt (keines, niedrig, mittel, hoch). Die Auswahl bewertet den Satz, bevorzugt am Abend koffeinfreie Tees und am Morgen Tees mit mehr Koffein, und zeigt bis zu drei unterschiedliche Teearten. Milligramm-Angaben sind Orientierungswerte, keine Laborwerte und keine Empfehlung für oder gegen Koffein.

## Datenschutz in der App

Die Auswahl bleibt im Browser und wird nicht gespeichert. Es werden keine Cookies gesetzt. Seitenaufrufe und das Ereignis `kauf_klick` gehen zusammengefasst an Vercel Web Analytics (Vercel Inc.), ohne persönliches Profil. Ein Kauf-Link öffnet einen externen Shop; von dort erhalten wir keine personenbezogenen Daten. Details stehen auf der Seite Datenschutz.

## Veröffentlichung

Der Workflow `.github/workflows/pages.yml` baut die Seite und kann sie auf GitHub Pages legen. Er startet nur manuell (`workflow_dispatch`), nicht bei Push auf `main`. Die öffentliche Website läuft auf Vercel. `vercel.json` setzt `cleanUrls`, damit `/impressum` und `/datenschutz` ohne Dateiendung erreichbar sind. Links mit `.html` funktionieren weiter.

## Offene Punkte

- Domain: yoursidequest.org (noch nicht verbunden, keine CNAME-Datei)
- GitHub Pages: Workflow erst nach Freigabe auslösen; die Seitenquelle bleibt bis dahin unverändert

## Legacy

Der frühere Clickdummy und das alte Formular liegen unter `legacy/` und werden nicht mitgebaut. Maßgeblich ist die Vite-App im Root.
