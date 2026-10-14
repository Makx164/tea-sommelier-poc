# Tee-Sommelier

Geschmacksempfehlung für Tee, direkt im Browser. Du wählst eine oder mehrere Richtungen (herb, fruchtig, blumig, erdig, mild, kräftig) und eine Tageszeit (Morgen, Mittag, Nachmittag, Abend). Die App schlägt ein bis drei Tees vor – mit kurzer Begründung, Zubereitung (Temperatur, Ziehzeit, Menge) und Koffeingehalt als Fakt.

Die Vorschläge kommen aus festen Regeln und einem lokalen Datensatz mit 29 gängigen Tees. Es gibt kein Backend, keine eigenen Produkte, keinen Shop, keine Cookies und kein Tracking. Schriftarten und Skripte kommen nur aus dieser Seite.

**Status: Vorschau, nicht live**

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

Die Auswahl bleibt im Browser. Es werden keine Cookies gesetzt, nichts analysiert und nichts an einen Server geschickt. Hosting ist, sobald veröffentlicht, GitHub Pages; Server-Logs liegen dann bei GitHub. Details stehen auf der Seite Datenschutz.

## Veröffentlichung

Der Workflow `.github/workflows/pages.yml` baut die Seite und kann sie auf GitHub Pages legen. Er startet nur manuell (`workflow_dispatch`), nicht bei Push auf `main`. GitHub-Pages-Einstellungen und eine CNAME-Datei werden in dieser Vorschau nicht geändert.

## Offene Punkte

- Domain: yoursidequest.org (noch nicht verbunden, keine CNAME-Datei)
- GitHub Pages: Workflow erst nach Freigabe auslösen; die Seitenquelle bleibt bis dahin unverändert

## Legacy

Der frühere Clickdummy und das alte Formular liegen unter `legacy/` und werden nicht mitgebaut. Maßgeblich ist die Vite-App im Root.
