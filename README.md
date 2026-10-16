# Teelotse

Geschmacksempfehlung für Tee, direkt im Browser. Du wählst eine oder mehrere Geschmacksrichtungen (fruchtig, blumig, herb, kräftig), eine oder mehrere Tageszeiten (Morgen, Mittag, Nachmittag, Abend), optional wofür du Tee suchst (Fokus, Verdauung, Beruhigung, Schlaf) und Koffein (Ja, Nein, Egal). Teelotse schlägt ein bis drei Tees vor – mit kurzer Begründung, Zubereitung (Temperatur, Ziehzeit, Menge) und Koffeingehalt als Fakt. Das ist eine Geschmacksorientierung, keine Gesundheitsaussage.

Die Vorschläge kommen aus festen Regeln und einem lokalen Datensatz mit 29 gängigen Tees. Es gibt kein Backend und keine eigenen Produkte. Jede Empfehlung hat einen Link „Hier kaufen“ auf `/go/<Tee>`. Diese Seiten entstehen beim Bau aus `src/affiliate.json` und leiten auf eine Amazon-Suche mit der PartnerNet-ID `tag=teelotse-21` weiter. Vercel Web Analytics zählt den Aufruf als Seitenaufruf, ohne Cookies und ohne eigenes Ereignis.

Farben: Teeblatt `#2F5D50`, Matcha `#9DBF8A`, Rooibos `#C8743A`, Creme `#F6F1E7`, Tinte `#1F2A2E`. Die Schriften Fraunces und Inter liegen im Bau (`@fontsource-variable/fraunces`, `@fontsource-variable/inter`, SIL Open Font License). Es wird kein externer Schrift-Server geladen. Die Wortmarke steht in Kopf- und Fußzeile, das Icon ist das Favicon.

**Status: v2.0, noch nicht veröffentlicht.** Die bisherige Fassung läuft auf https://teelotse.de (Vercel).

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

`npm run build` schreibt nach `dist/`. Diese Dateien sind die Website (Start, Impressum, Datenschutz und eine Weiterleitung je Tee unter `go/`).

## Empfehlung

Jeder Tee hat Geschmacksgewichte, eine Passung zu den Tageszeiten, eine Passung zu einer Richtung und einen Koffeingehalt (keines, niedrig, mittel, hoch). Die Richtung ist optional und nennt, womit ein Tee häufig verbunden wird. Sie ist eine Geschmacksorientierung, keine Gesundheitsaussage. Mehrere Tageszeiten werden gemittelt; ohne Richtung zählen Geschmack, Tageszeit und Koffein. Die Auswahl bewertet den Satz, bevorzugt am Abend koffeinfreie Tees und am Morgen Tees mit mehr Koffein, und zeigt bis zu drei unterschiedliche Teearten. „Nein“ bei Koffein lässt nur koffeinfreie Tees zu, „Ja“ nur Tees mit Koffein, „Egal“ filtert nicht. Milligramm-Angaben sind Orientierungswerte, keine Laborwerte und keine Empfehlung für oder gegen Koffein.

## Datenschutz in der App

Die Auswahl bleibt im Browser und wird nicht gespeichert. Es werden keine Cookies gesetzt. Seitenaufrufe, auch die Weiterleitung `/go/<Tee>`, gehen zusammengefasst an Vercel Web Analytics (Vercel Inc.), ohne persönliches Profil. Von dort öffnet sich ein externer Shop; von dem Shop erhalten wir keine personenbezogenen Daten. Details stehen auf der Seite Datenschutz.

## Veröffentlichung

Der Workflow `.github/workflows/pages.yml` baut die Seite und kann sie auf GitHub Pages legen. Er startet nur manuell (`workflow_dispatch`), nicht bei Push auf `main`. Die öffentliche Website läuft auf Vercel. `vercel.json` setzt `cleanUrls`, damit `/impressum`, `/datenschutz` und `/go/<Tee>` ohne Dateiendung erreichbar sind. Links mit `.html` funktionieren weiter.

## Offene Punkte

- GitHub Pages: Workflow erst nach Freigabe auslösen; die Seitenquelle bleibt bis dahin unverändert

## Legacy

Der frühere Clickdummy und das alte Formular liegen unter `legacy/` und werden nicht mitgebaut. Maßgeblich ist die Vite-App im Root.
