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

/** Typografische Karten, dieselbe Form wie die Tees: Label, Streifen, kein Bild. */
export function accessoryCardsHtml(): string {
  const noteId = 'werbung-zubehoer';
  const cards = ACCESSORIES.map((item) => {
    if (!SLUG.test(item.slug)) throw new Error(`Ungültiger Zubehör-Slug: ${item.slug}`);
    const moreId = `mehr-zubehoer-${item.slug}`;
    return `          <article class="tea-card" data-accessory="${escapeHtml(item.slug)}" data-type="Zubehör">
            <h3 class="tea-heading">
              <button type="button" class="tea-toggle" aria-expanded="false" aria-controls="${escapeHtml(moreId)}">
                <span class="tea-name">${escapeHtml(item.name)}</span>
                <span class="tea-kind">Zubehör</span>
                <span class="tea-line">${escapeHtml(item.line)}</span>
              </button>
            </h3>
            <div class="tea-more" id="${escapeHtml(moreId)}">
              <div class="tea-more-inner">
                <p class="ad-tag">Werbung</p>
                <p class="tea-buy"><a class="btn btn-primary" href="/go/${escapeHtml(item.slug)}" target="_blank" rel="sponsored noopener" aria-describedby="${noteId}">Hier kaufen</a></p>
              </div>
            </div>
          </article>`;
  });
  return cards.join('\n');
}
