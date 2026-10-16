import './analytics';
import { teasForCollection, COLLECTIONS } from './collections';
import { bestTimes, contradictionHints, recommend, tasteLabelsByWeight } from './recommender';
import {
  CAFFEINE_CHOICES,
  CAFFEINE_CHOICE_LABEL,
  CAFFEINE_TILE_LABEL,
  OCCASIONS,
  OCCASION_LABEL,
  TASTES,
  TASTE_LABEL,
  TIME_LABEL,
  capitalizeDe,
  joinDe,
  timesForOccasions,
  type CaffeineChoice,
  type Preferences,
  type Recommendation,
  type Tea,
} from './types';

const AFFILIATE_NOTE =
  'Werbung/Affiliate-Link: Bei Kauf erhalten wir ggf. eine Provision, für dich ändert sich der Preis nicht.';

const COUNT_TEXT = ['', 'Ein Tee liegt vorn.', 'Zwei Tees passen gut.', 'Drei Tees zur Auswahl.'];

function required<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Element fehlt: ${selector}`);
  return node;
}

const finder = required<HTMLFormElement>('#finder');
const occasionField = required<HTMLFieldSetElement>('#anlass');
const tasteField = required<HTMLFieldSetElement>('#geschmack');
const caffeineField = required<HTMLFieldSetElement>('#koffein');
const formError = required<HTMLParagraphElement>('#form-error');
const auswahl = required<HTMLElement>('#auswahl');
const ergebnis = required<HTMLElement>('#ergebnis');
const ergebnisTitel = required<HTMLHeadingElement>('#ergebnis-titel');
const ergebnisLead = required<HTMLParagraphElement>('#ergebnis-lead');
const ergebnisHinweis = required<HTMLParagraphElement>('#ergebnis-hinweis');
const ergebnisListe = required<HTMLElement>('#ergebnis-liste');
const findeTee = required<HTMLAnchorElement>('#finde-tee');
const beliebtListe = required<HTMLElement>('#beliebte-liste');

findeTee.addEventListener('click', (event) => {
  event.preventDefault();
  showForm(occasionField);
});

finder.addEventListener('submit', (event) => {
  event.preventDefault();
  const prefs = readPreferences();
  if (!prefs) return;
  showResults(recommend(prefs), prefs);
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-action="zurueck"]')) {
  button.addEventListener('click', () => showForm(occasionField));
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-action="neu"]')) {
  button.addEventListener('click', () => {
    finder.reset();
    for (const field of [occasionField, tasteField, caffeineField]) {
      field.setAttribute('aria-invalid', 'false');
    }
    formError.hidden = true;
    showForm(occasionField);
  });
}

renderCollections();

function showForm(focusTarget: HTMLElement): void {
  ergebnis.hidden = true;
  auswahl.hidden = false;
  focusTarget.focus();
  scrollTo(auswahl);
}

function checkedValue(group: string): string | undefined {
  return finder.querySelector<HTMLInputElement>(`input[data-group="${group}"]:checked`)?.value;
}

function checkedValues<T extends string>(group: string, allowed: readonly T[]): T[] {
  return [...finder.querySelectorAll<HTMLInputElement>(`input[data-group="${group}"]:checked`)]
    .map((input) => input.value)
    .filter((value): value is T => (allowed as readonly string[]).includes(value));
}

function readPreferences(): Preferences | null {
  const occasions = checkedValues('occasion', OCCASIONS);
  const tastes = checkedValues('taste', TASTES);
  const caffeineValue = checkedValue('caffeine');
  const caffeine = (CAFFEINE_CHOICES as readonly string[]).includes(caffeineValue ?? '')
    ? (caffeineValue as CaffeineChoice)
    : 'egal';

  occasionField.setAttribute('aria-invalid', occasions.length ? 'false' : 'true');
  tasteField.setAttribute('aria-invalid', 'false');
  caffeineField.setAttribute('aria-invalid', 'false');

  if (!occasions.length) {
    formError.textContent = 'Bitte wähle mindestens einen Anlass.';
    formError.hidden = false;
    occasionField.focus();
    return null;
  }

  formError.hidden = true;
  return { occasions, tastes, caffeine };
}

function showResults(items: Recommendation[], prefs: Preferences): void {
  const parts = [joinDe(prefs.occasions.map((occasion) => OCCASION_LABEL[occasion]))];
  if (prefs.tastes.length) parts.push(joinDe(prefs.tastes.map((taste) => capitalizeDe(TASTE_LABEL[taste]))));
  parts.push(joinDe(timesForOccasions(prefs.occasions).map((time) => TIME_LABEL[time])));
  const count = items.length ? (COUNT_TEXT[items.length] ?? '') : 'Dazu liegt kein Tee im Satz.';
  ergebnisLead.textContent = `Für ${joinDe(parts)}, ${CAFFEINE_CHOICE_LABEL[prefs.caffeine]}. ${count}`;
  const hints = contradictionHints(prefs);
  ergebnisHinweis.textContent = hints.join(' ');
  ergebnisHinweis.hidden = hints.length === 0;
  ergebnisListe.dataset.count = String(items.length);
  ergebnisListe.replaceChildren(...items.map((item, index) => renderCard(item, index)));
  auswahl.hidden = true;
  ergebnis.hidden = false;
  ergebnisTitel.focus();
  scrollTo(ergebnis);
}

const CARD_ART = `<svg viewBox="0 0 640 280" xmlns="http://www.w3.org/2000/svg" focusable="false">
  <circle cx="530" cy="36" r="92" fill="currentColor" opacity="0.16"/>
  <circle cx="70" cy="250" r="120" fill="currentColor" opacity="0.1"/>
  <path d="M168 86c18 34-10 48 6 84" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" opacity="0.8"/>
  <path d="M214 62c16 32-8 42 6 76" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" opacity="0.5"/>
  <path d="M248 236C312 118 430 52 536 18 438 96 360 168 248 236Z" fill="currentColor"/>
  <path class="vein" d="M268 218C348 128 446 62 522 28" fill="none" stroke="var(--art-vein)" stroke-width="4" stroke-linecap="round"/>
</svg>`;

function renderArt(): HTMLElement {
  const art = document.createElement('div');
  art.className = 'tea-art';
  art.setAttribute('aria-hidden', 'true');
  art.innerHTML = CARD_ART;
  return art;
}

function renderCard(item: Recommendation, index: number): HTMLElement {
  const { tea } = item;
  const card = document.createElement('article');
  card.className = 'tea-card';
  card.dataset.type = tea.type;

  const body = document.createElement('div');
  body.className = 'tea-body';

  const rank = document.createElement('p');
  rank.className = 'tea-rank';
  rank.textContent = `Vorschlag ${index + 1}`;

  const title = document.createElement('h3');
  title.textContent = tea.name;

  const reason = document.createElement('p');
  reason.className = 'tea-reason';
  reason.textContent = item.reason;

  card.append(renderArt(), body);
  body.append(rank, title, reason, renderFacts(tea));

  if (tea.brewNote) {
    const note = document.createElement('p');
    note.className = 'brew-note';
    note.textContent = tea.brewNote;
    body.append(note);
  }

  body.append(renderPurchase(tea));
  return card;
}

function renderFacts(tea: Tea): HTMLElement {
  const facts = document.createElement('dl');
  facts.className = 'facts';
  facts.setAttribute('aria-label', `Fakten ${tea.name}`);
  const caffeine = CAFFEINE_TILE_LABEL[tea.caffeine];
  const times = bestTimes(tea).map((time) => TIME_LABEL[time]);
  facts.append(
    factItem('Teeart', tea.type),
    factItem('Koffein', caffeine),
    factItem('Geschmack', joinDe(tasteLabelsByWeight(tea))),
    factItem('Ziehzeit', tea.steepTime),
    factItem('Wassertemperatur', tea.temperature),
    factItem('Beste Tageszeit', joinDe(times)),
    factItem('Herkunft', tea.origin),
  );
  return facts;
}

function factItem(label: string, value: string): HTMLElement {
  const wrap = document.createElement('div');
  const term = document.createElement('dt');
  term.textContent = label;
  const detail = document.createElement('dd');
  detail.textContent = value;
  wrap.append(term, detail);
  return wrap;
}

let purchaseSeq = 0;

function renderBuyLink(tea: Tea, describedBy?: string): HTMLAnchorElement {
  const link = document.createElement('a');
  link.className = 'btn btn-primary';
  link.href = `/go/${tea.id}`;
  link.textContent = 'Hier kaufen';
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'sponsored noopener');
  link.setAttribute('aria-label', `Hier kaufen: ${tea.name}`);
  if (describedBy) link.setAttribute('aria-describedby', describedBy);
  return link;
}

function renderPurchase(tea: Tea): HTMLElement {
  const block = document.createElement('div');
  block.className = 'tea-buy';
  purchaseSeq += 1;
  const hintId = `affiliate-${tea.id}-${purchaseSeq}`;

  const link = renderBuyLink(tea, hintId);
  const hint = document.createElement('p');
  hint.className = 'affiliate-note';
  hint.id = hintId;
  hint.textContent = AFFILIATE_NOTE;

  block.append(link, hint);
  return block;
}

function renderCollections(): void {
  beliebtListe.replaceChildren(
    ...COLLECTIONS.map((collection) => {
      const card = document.createElement('article');
      card.className = 'collection-card';
      card.dataset.collection = collection.id;

      const title = document.createElement('h3');
      title.textContent = collection.title;
      card.append(title);

      if (collection.intro) {
        const intro = document.createElement('p');
        intro.className = 'collection-intro';
        intro.textContent = collection.intro;
        card.append(intro);
      }

      if (collection.note) {
        const note = document.createElement('p');
        note.className = 'collection-note';
        note.textContent = collection.note;
        card.append(note);
      }

      const affiliate = document.createElement('p');
      affiliate.className = 'affiliate-note';
      affiliate.id = `affiliate-sammlung-${collection.id}`;
      affiliate.textContent = AFFILIATE_NOTE;

      const list = document.createElement('ul');
      list.className = 'collection-teas';
      for (const entry of teasForCollection(collection)) {
        const item = document.createElement('li');
        const name = document.createElement('p');
        name.className = 'collection-name';
        name.textContent = entry.tea.name;
        const reason = document.createElement('p');
        reason.className = 'collection-reason';
        reason.textContent = entry.reason;
        const buy = document.createElement('div');
        buy.className = 'tea-buy';
        buy.append(renderBuyLink(entry.tea, affiliate.id));
        item.append(name, reason, buy);
        list.append(item);
      }
      card.append(list, affiliate);
      return card;
    }),
  );
}

function scrollTo(node: HTMLElement): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}
