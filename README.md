# Tee-Sommelier

Geschmacksempfehlung für Tee, direkt im Browser. Du wählst eine oder mehrere Richtungen (herb, fruchtig, blumig, erdig, mild, kräftig) und eine Tageszeit (Morgen, Mittag, Nachmittag, Abend). Die App schlägt ein bis drei Tees vor – mit kurzer Begründung, Zubereitung (Temperatur, Ziehzeit, Menge) und Koffeingehalt als Fakt.

Die Vorschläge kommen aus festen Regeln und einem lokalen Datensatz mit 29 gängigen Tees. Es gibt kein Backend, keine eigenen Produkte, keinen Shop, keine Cookies und kein Tracking. Schriftarten und Skripte kommen nur aus dieser Seite.

**Status: live**

Öffentliche Adresse: https://tee.yoursidequest.org

GitHub Pages liefert den Branch `main` im Verzeichnis `/` aus. https://makx164.github.io/tea-sommelier-poc/ leitet auf die eigene Domain um, sobald GitHub die Domain aus der Datei `CNAME` übernommen hat.

## Lokal starten

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm run dev
```

Der Entwicklungsserver zeigt die App im Browser. Die Quelle liegt unter `site/` (`site/index.html`, `site/impressum.html`, `site/datenschutz.html`, `site/src`). Die HTML-Dateien im Repository-Root sind das Bauergebnis und werden beim Veröffentlichen überschrieben.

Produktionsbau und Abgleich mit dem ausgelieferten Root:

```bash
npm test
npm run build
npm run preview
npm run pages:sync
```

`npm run build` schreibt nach `dist/` mit Basispfad `/`. `npm run pages:sync` kopiert diesen Bau ins Repository-Root. `site/` und `legacy/` bleiben dabei stehen.

## Empfehlung

Jeder Tee hat Geschmacksgewichte, eine Passung zur Tageszeit und einen Koffeingehalt (keines, niedrig, mittel, hoch). Die Auswahl bewertet den Satz, bevorzugt am Abend koffeinfreie Tees und am Morgen Tees mit mehr Koffein, und zeigt bis zu drei unterschiedliche Teearten. Milligramm-Angaben sind Orientierungswerte, keine Laborwerte und keine Empfehlung für oder gegen Koffein.

## Datenschutz in der App

Die Auswahl bleibt im Browser. Es werden keine Cookies gesetzt, nichts analysiert und nichts an einen Server geschickt. Hosting ist GitHub Pages; Server-Logs liegen bei GitHub. Details stehen auf der Seite Datenschutz.

## Veröffentlichung

GitHub Pages bleibt auf „Deploy from a branch“: Branch `main`, Ordner `/`. Diese Einstellung wird nicht geändert.

Im Root von `main` liegen die gebauten Dateien. Der Basispfad ist `/`, damit Skripte, Styles und das Favicon an der Domain-Wurzel laden. `CNAME` enthält `tee.yoursidequest.org`. `.nojekyll` liegt im Root, damit Pages die Dateien ohne Jekyll ausliefert. `/legacy` bleibt der archivierte Clickdummy und das frühere Formular.

Der Workflow `.github/workflows/pages.yml` läuft bei jedem Push auf `main` und kann zusätzlich von Hand gestartet werden. Er testet, baut und committet die gebauten Dateien zurück auf `main`, wenn sie sich geändert haben. Ein Commit mit `[skip ci]` startet keinen neuen Lauf.

Für die Domain zeigt ein DNS-CNAME-Eintrag `tee.yoursidequest.org` auf `makx164.github.io`.

## Legacy

Der frühere Clickdummy und das alte Formular liegen unter `legacy/` und werden nicht mitgebaut. Unter `/legacy` bleiben sie erreichbar. Maßgeblich ist die gebaute App im Root; die Quelle liegt in `site/`.
