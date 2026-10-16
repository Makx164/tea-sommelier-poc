# Änderungsprotokoll

## 2026-10-16 – Auswahl, Ergebnis, beliebte Tees

- Schritt 1 ist Wirkung / Anlass und Pflicht: elf Kacheln mit Emoji, Mehrfachauswahl und kurze Tipp-Animation. Formulierung: wird traditionell getrunken zum gewählten Anlass
- Schritt 2 Geschmack: kräutig, blumig, fruchtig, würzig, malzig, mild, rauchig, minzig
- Danach Koffein, dann Tageszeit (weiter Mehrfachauswahl, mindestens eine). „Wofür suchst du Tee?“ bleibt optional
- Ergebnis: ein bis zwei Sätze, warum der Tee zur Auswahl passt, darunter Faktkacheln (Teeart, Koffein als keins/wenig/mittel/viel, Geschmack, Ziehzeit, Wassertemperatur, beste Tageszeit, Herkunft). „Zurück“ behält die Auswahl, „Neue Auswahl“ setzt sie zurück
- „Hier kaufen“ bleibt `/go/<Tee>` mit `tag=teelotse-21` und öffnet einen neuen Tab (`rel="sponsored noopener"`)
- Abschnitt „Beliebte Tees für …“ mit festen Karten: Für die Arbeit, Für Sportler, Für den Abend, Koffeinfrei, Für Einsteiger, Für Schwangere. Für Schwangere nur Rooibos und reiner Hagebuttentee, dazu der Hinweis „Bitte im Zweifel mit Hebamme/Ärztin absprechen“

## 2026-10-16

- Amazon-PartnerNet: jede amazon.de-URL in `src/affiliate.json` trägt `tag=teelotse-21`. Ein vorhandener `tag`-Parameter wird ersetzt, andere Query-Parameter bleiben. Werbehinweis, Analytics und `/go/`-Weiterleitung bleiben

## 2026-10-15 – Auswahl

- „Wofür suchst du Tee?“ ist optional. Ohne Richtung zählen Geschmack, Tageszeit und Koffein
- Tageszeit ist eine Mehrfachauswahl und bleibt Pflicht (mindestens eine). Mehrere Zeiten werden gemittelt

## 2026-10-15

Öffentliche Adresse ist https://teelotse.de (Vercel). Die Subdomain tee.yoursidequest.org entfällt.

## 2026-10-15 – v2.0 Teelotse (unveröffentlicht)

Aus Tee-Sommelier wird Teelotse.

- Marke: Teeblatt `#2F5D50`, Matcha `#9DBF8A`, Rooibos `#C8743A`, Creme `#F6F1E7`, Tinte `#1F2A2E`. Schriften Fraunces und Inter selbst gehostet über `@fontsource-variable`, ohne externen Schrift-Server
- Wortmarke in Kopf- und Fußzeile, Icon als Favicon
- Startseite mit großem Hero und Knopf „Finde deinen Tee“. Empfehlungen als Produktkarten mit „Hier kaufen“
- Hinweis „Vorschau, nicht live“ entfernt
- Impressum und Datenschutz nennen Teelotse
- Affiliate-Links, `/go/<Tee>`, `rel="sponsored noopener"`, Werbehinweis, `@vercel/analytics` und `cleanUrls` bleiben
- Auswahl: vier Geschmäcker (fruchtig, blumig, herb, kräftig), Tageszeit, Richtung (Fokus, Verdauung, Beruhigung, Schlaf) als Geschmacksorientierung, Koffein Ja/Nein/Egal. „Nein“ zeigt nur koffeinfreie Tees

## 2026-10-15 – v1.1 (unveröffentlicht)

- Kauf-Link je Tee in `src/affiliate.json` (Amazon-Suche ohne Partner-ID). „Hier kaufen“ führt auf `/go/<Tee>` und zeigt den Hinweis auf Werbung/Affiliate
- Weiterleitungsseiten entstehen beim Bau: `@vercel/analytics` (`inject()`) zählt den Aufruf als Seitenaufruf, danach `location.replace`, Meta-Refresh als Ersatz und ein sichtbarer Link. `noindex`. Kein eigenes Ereignis
- `vercel.json` mit `cleanUrls`, damit `/impressum`, `/datenschutz` und `/go/<Tee>` erreichbar sind; `.html`-Links bleiben gültig
- Datenschutz: Affiliate-Links (Weiterleitung, externer Shop, eigene Datenschutzerklärung, keine personenbezogenen Daten an uns) und Vercel Web Analytics (cookielos, keine persönlichen Profile, zusammengefasste Seitenaufrufe, Vercel Inc.)

## 2026-10-14 – v1.0

Tee-Sommelier ist live auf tee.yoursidequest.org (Vercel).

- Produktionsbau mit Basispfad `/` nach `dist/`
- Status: live auf tee.yoursidequest.org (Vercel)

## 2026-10-13 – v1.0-preview

Erste öffentliche Vorschau des Tee-Sommeliers.

- Geschmack und Tageszeit, regelbasierte Empfehlung von 1–3 Tees aus einem lokalen Datensatz (29 Tees)
- Kurze Begründung, Zubereitung (Temperatur, Ziehzeit, Menge) und Koffeingehalt als Fakt
- Impressum und Datenschutz mit Maximilian Hillert, Illgnerstraße 35, 04442 Zwenkau, maximilianhillert@mail.grokbot.com als Anbieter und verantwortliche Stelle
- Kein Shop, kein Backend, keine Cookies, kein Tracking, keine Gesundheits- oder Heilaussagen
- Alter Clickdummy und das frühere Formular liegen unter `legacy/`
- GitHub-Pages-Workflow nur per `workflow_dispatch`
- Status: Vorschau, nicht live
