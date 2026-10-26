# Sichtbarkeit von Teelotse

Stand der technischen Umsetzung im Code. Konten und Webmaster-Tools sind hier nicht eingerichtet.

## Was die Seite jetzt mitbringt

- Jeder Bereich hat eine eigene Adresse: `/finden`, `/entdecken`, `/create`, `/zubehoer`, `/blog`. Artikel liegen unter `/blog/<slug>`, sobald sie nicht mehr als Entwurf markiert sind.
- Die Texte der Bereiche und der Blog stehen als HTML in der ausgelieferten Seite. Eine Empfehlung unter Finden und die Vorschau unter Create brauchen weiterhin JavaScript. Die Listen, das Zubehör und der Blog sind auch ohne JavaScript lesbar.
- Die Startseite bleibt die lange Seite mit Hero und allen Bereichen.
- Jede Seite hat genau eine Hauptüberschrift, `lang="de"`, eigenen Titel, eigene Beschreibung, Canonical-URL, Open-Graph- und Twitter-Angaben. Das Bild fürs Teilen ist die Leuchtturm-Zeichnung, ausgeliefert als AVIF und WebP.
- Strukturierte Daten: WebSite und Organization auf der Startseite, BreadcrumbList auf den Unterseiten, ItemList für die Tee-Listen und das Zubehör, BlogPosting für veröffentlichte Artikel. Es gibt keine Sterne und keine erfundenen Bewertungen.
- `sitemap.xml`, `robots.txt` und `llms.txt` werden beim Bau erzeugt. `/go/` ist in der Sitemap ausgelassen und für Crawler gesperrt, weil das nur Weiterleitungen sind. Suchmaschinen und gängige Assistenten-Crawler sind erlaubt.
- Veröffentlichte Beiträge (`draft: false`) stehen in der Sitemap und in `llms.txt`. Entwürfe (`draft: true`) fehlen dort. Auf der Vorschau-Umgebung von Vercel sind Entwürfe mit dem Hinweis „Entwurf“ sichtbar und auf `noindex` gesetzt. Im normalen Bau, auch für die Live-Seite, fehlen sie.

## Was der Inhaber außerhalb des Codes tun müsste

Nichts davon ist angelegt. Es braucht jeweils ein Konto des Inhabers.

1. **Google Search Console** für die Property `https://teelotse.de/`. Dort die Sitemap `https://teelotse.de/sitemap.xml` einreichen und die Inhaberschaft bestätigen (DNS oder HTML, je nach Anleitung von Google).
2. **Bing Webmaster Tools** für dieselbe Domain, Sitemap ebenfalls einreichen. Bing kann die Bestätigung aus der Search Console übernehmen, wenn man das so auswählt.
3. Nach dem Merge auf `main` ein paar Tage später in beiden Tools prüfen, ob die neuen Adressen erfasst werden und ob `/go/` draußen bleibt.
4. Die Vorschau-URL von Vercel nicht als öffentliche Hauptadresse anmelden. Live ist `https://teelotse.de/` nach Freigabe des Merge.

Schrift, Farben und Aufbau kommen von dieser Website. Es wird kein externes Schrift- oder Tracking-Skript geladen. Vercel Web Analytics bleibt wie bisher, cookielos, siehe Datenschutz.
