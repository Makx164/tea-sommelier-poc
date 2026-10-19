import { DISCOVER_LISTS, teasForList } from './collections';
import { MOMENT_LINE } from './tea-copy';
import {
  AFFILIATE_NOTE,
  INGREDIENTS_GAP,
  caffeineFact,
  preparationFact,
} from './types';
import { teaVisual } from './visual';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function teaCardHtml(teaId: string, name: string, type: string, line: string, preparation: string, caffeine: string, ingredients: string, noteId: string): string {
  return `<article class="tea-card" data-tea="${escapeHtml(teaId)}" data-type="${escapeHtml(type)}">
            <div class="tea-visual" aria-hidden="true">${teaVisual(type)}</div>
            <div class="tea-body">
              <h3>${escapeHtml(name)}</h3>
              <p class="tea-line">${escapeHtml(line)}</p>
              <dl class="facts">
                <div><dt>Zubereitung</dt><dd>${escapeHtml(preparation)}</dd></div>
                <div><dt>Koffein</dt><dd>${escapeHtml(caffeine)}</dd></div>
                <div><dt>Zutaten</dt><dd>${escapeHtml(ingredients)}</dd></div>
              </dl>
              <p class="ad-tag">Werbung</p>
              <p class="tea-buy"><a class="btn btn-primary" href="/go/${escapeHtml(teaId)}" target="_blank" rel="sponsored noopener" aria-describedby="${escapeHtml(noteId)}">Hier kaufen</a></p>
            </div>
          </article>`;
}

/** Karten stehen im HTML, damit sie ohne JavaScript sichtbar sind. */
export function discoverListsHtml(): string {
  return DISCOVER_LISTS.map((list) => {
    const noteId = `werbung-${list.id}`;
    const cards = teasForList(list)
      .map(({ tea }) => {
        const line = MOMENT_LINE[tea.id];
        if (!line) throw new Error(`Satz fehlt: ${tea.id}`);
        return teaCardHtml(
          tea.id,
          tea.name,
          tea.type,
          line,
          preparationFact(tea),
          caffeineFact(tea.caffeine),
          tea.ingredients?.trim() || INGREDIENTS_GAP,
          noteId,
        );
      })
      .join('\n');
    return `<section class="discover-list" aria-labelledby="liste-${list.id}" data-list="${list.id}">
          <h3 id="liste-${list.id}">${escapeHtml(list.title)}</h3>
          <div class="discover-grid">
            ${cards}
          </div>
          <p class="affiliate-note" id="${noteId}">${escapeHtml(AFFILIATE_NOTE)}</p>
        </section>`;
  }).join('\n');
}
