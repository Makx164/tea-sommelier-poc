# Änderungsprotokoll

## 2026-10-15 – v2.0 Teelotse (unveröffentlicht)

Aus Tee-Sommelier wird Teelotse.

- Marke: Teeblatt `#2F5D50`, Matcha `#9DBF8A`, Rooibos `#C8743A`, Creme `#F6F1E7`, Tinte `#1F2A2E`. Schriften Fraunces und Inter selbst gehostet über `@fontsource-variable`, ohne externen Schrift-Server
- Wortmarke in Kopf- und Fußzeile, Icon als Favicon
- Startseite mit großem Hero und Knopf „Finde deinen Tee“. Empfehlungen als Produktkarten mit „Hier kaufen“
- Hinweis „Vorschau, nicht live“ entfernt
- Impressum und Datenschutz nennen Teelotse
- Affiliate-Links, `/go/<Tee>`, `rel="sponsored noopener"`, Werbehinweis, `@vercel/analytics` und `cleanUrls` bleiben

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
