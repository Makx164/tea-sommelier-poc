# Blog, kurz zum Schreiben

Neue Texte sind Markdown-Dateien in `content/blog/`. Der Dateiname wird die Adresse: `content/blog/mein-text.md` ergibt `/blog/mein-text`.

## Kopf der Datei

```markdown
---
title: "Kurzer Titel"
date: 2026-10-20
description: Ein Satz, der auch in der Übersicht und in der Suche steht.
draft: true
---
```

- `draft: true` heißt Entwurf. Der Text erscheint nicht in der Sitemap und nicht auf der Live-Seite. Auf der Vorschau steht er mit dem Hinweis „Entwurf“.
- `draft: false` veröffentlicht ihn: Übersicht, eigene Seite, Sitemap.
- Datum im Format Jahr-Monat-Tag. Beschreibung und Titel sind Pflicht.
- Im Text gehen Absätze, `##` und `###` als Überschriften, Listen mit `- ` und **fett**. Links nur auf diese Website, zum Beispiel `[Entdecken](/entdecken)`.

## Erlaubt

Geschmack, Aroma, Temperatur, Stimmung, Moment, Herkunft, Zubereitung. Was eine Sorte im Teelotse-Datensatz schon sagt (Ziehzeit, Temperatur, Menge, Koffein als „enthält Koffein“ oder „koffeinfrei“), darf zitiert werden. Allgemein bekannt und unstrittig ist zum Beispiel: loser Tee braucht ein Sieb oder einen Filter, eine Kanne fasst mehrere Tassen. Das Wort Stimmung ist inhaltlich in Ordnung. Auf der Seite besser „Moment“ oder „Laune“ schreiben, sonst bleibt eine vorhandene Prüfung hängen.

## Verboten

- Gesundheits- und Heilversprechen, auch indirekt. Nicht schreiben: gesund, stärkt, entgiftet, hilft bei, beruhigt, belebend, Wirkung, heilt, Studien zeigen, Vitamin, Antioxidans, Schlaf, Verdauung, Magen, Immunsystem.
- Das Wort KI und das englische AI. Weder im Titel noch im Text noch in der Beschreibung.
- Erfundene Zahlen, Preise, Bewertungen, Marken, Quellen oder Studien. Ziehzeit, Temperatur, Menge und Koffein nur so, wie sie in `src/data/teas.json` stehen. Keine Milligramm-Angaben, die der Datensatz nicht hat.
- Emojis, Icons und generierte Bilder. Der Blog ist Text.

Zwei Beispielartikel liegen schon im Ordner und sind Entwürfe.
