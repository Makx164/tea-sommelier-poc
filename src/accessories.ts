import { accessoryPhotoMarkup } from './accessory-photos';
import accessoryData from './accessories.json';

export type Accessory = {
  slug: string;
  name: string;
  line: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ACCESSORIES: readonly Accessory[] = accessoryData;

export const ACCESSORY_SLUGS: readonly string[] = ACCESSORIES.map((item) => item.slug);

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Dieselbe Kartenform wie die Tees: Foto, zwei Zeilen, Kaufzeile erst aufgeklappt. */
export function accessoryCardsHtml(): string {
  const cards = ACCESSORIES.map((item) => {
    if (!SLUG.test(item.slug)) throw new Error(`Ungültiger Zubehör-Slug: ${item.slug}`);
    const moreId = `mehr-zubehoer-${item.slug}`;
    return `          <article class="tea-card" data-accessory="${escapeHtml(item.slug)}" data-type="Zubehör">
            <h3 class="tea-heading">
              <button type="button" class="tea-toggle" aria-expanded="false" aria-controls="${escapeHtml(moreId)}">
                ${accessoryPhotoMarkup(item.slug)}
                <span class="tea-copy">
                  <span class="tea-name">${escapeHtml(item.name)}</span>
                  <span class="tea-kind">Zubehör</span>
                  <span class="tea-line">${escapeHtml(item.line)}</span>
                </span>
              </button>
            </h3>
            <div class="tea-more" id="${escapeHtml(moreId)}">
              <div class="tea-more-inner">
                <p class="tea-buy"><a class="tea-shop" href="/go/${escapeHtml(item.slug)}" target="_blank" rel="sponsored noopener" aria-describedby="affiliate-hinweis">Hier kaufen</a></p>
              </div>
            </div>
          </article>`;
  });
  return cards.join('\n');
}
