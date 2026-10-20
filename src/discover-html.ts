import { DISCOVER_LISTS, teasForList } from './collections';
import { MOMENT_LINE } from './tea-copy';
import { AFFILIATE_NOTE, caffeineFact, preparationFact } from './types';

/** Ohne JavaScript sichtbar. Mit JavaScript klappt der Rest zu. */
const VISIBLE_COUNT = 3;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Zutatenzeile nur bei echtem Eintrag. Leere Felder bleiben unsichtbar. */
export function ingredientFactHtml(ingredients: string | undefined): string {
  const value = ingredients?.trim();
  if (!value) return '';
  return `<div><dt>Zutaten</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function teaCardHtml(
  teaId: string,
  name: string,
  type: string,
  line: string,
  preparation: string,
  caffeine: string,
  ingredients: string | undefined,
  noteId: string,
): string {
  const ingredient = ingredientFactHtml(ingredients);
  const ingredientBlock = ingredient ? `\n                <div class="tea-ingredients">${ingredient}</div>` : '';
  const moreId = `mehr-${noteId}-${teaId}`;
  return `<article class="tea-card" data-tea="${escapeHtml(teaId)}" data-type="${escapeHtml(type)}">
            <h3 class="tea-heading">
              <button type="button" class="tea-toggle" aria-expanded="false" aria-controls="${escapeHtml(moreId)}">
                <span class="tea-name">${escapeHtml(name)}</span>
                <span class="tea-kind">${escapeHtml(type)}</span>
                <span class="tea-line">${escapeHtml(line)}</span>
              </button>
            </h3>
            <div class="tea-more" id="${escapeHtml(moreId)}">
              <div class="tea-more-inner">
                <p class="tea-prep"><span>Zubereitung</span> ${escapeHtml(preparation)}</p>
                <p class="tea-caffeine">${escapeHtml(caffeine)}</p>${ingredientBlock}
                <p class="ad-tag">Werbung</p>
                <p class="tea-buy"><a class="btn btn-primary" href="/go/${escapeHtml(teaId)}" target="_blank" rel="sponsored noopener" aria-describedby="${escapeHtml(noteId)}">Hier kaufen</a></p>
              </div>
            </div>
          </article>`;
}

/** Karten stehen im HTML, damit sie ohne JavaScript sichtbar sind. */
export function discoverListsHtml(): string {
  return DISCOVER_LISTS.map((list) => {
    const noteId = `werbung-${list.id}`;
    const cards = teasForList(list).map(({ tea }) => {
      const line = MOMENT_LINE[tea.id];
      if (!line) throw new Error(`Satz fehlt: ${tea.id}`);
      return teaCardHtml(
        tea.id,
        tea.name,
        tea.type,
        line,
        preparationFact(tea),
        caffeineFact(tea.caffeine),
        tea.ingredients,
        noteId,
      );
    });
    const visible = cards.slice(0, VISIBLE_COUNT).join('\n');
    const extra = cards.slice(VISIBLE_COUNT);
    const restId = `rest-${list.id}`;
    const rest =
      extra.length === 0
        ? ''
        : `<div class="discover-rest" id="${restId}">
          <div class="discover-grid">
            ${extra.join('\n')}
          </div>
        </div>
        <button type="button" class="btn btn-ghost discover-toggle" aria-expanded="true" aria-controls="${restId}" hidden>Alle anzeigen (${extra.length})</button>`;
    return `<section class="discover-list" aria-labelledby="liste-${list.id}" data-list="${list.id}">
          <h3 id="liste-${list.id}">${escapeHtml(list.title)}</h3>
          <div class="discover-grid">
            ${visible}
          </div>
          ${rest}
          <p class="affiliate-note" id="${noteId}">${escapeHtml(AFFILIATE_NOTE)}</p>
        </section>`;
  }).join('\n');
}
