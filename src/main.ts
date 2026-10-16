import './analytics';
import { recommend } from './recommender';
import {
  CAFFEINE_CHOICES,
  CAFFEINE_CHOICE_LABEL,
  CAFFEINE_LEVELS,
  MOODS,
  MOOD_LABEL,
  TASTES,
  TASTE_LABEL,
  TIMES,
  TIME_LABEL,
  capitalizeDe,
  joinDe,
  type Caffeine,
  type CaffeineChoice,
  type Mood,
  type Preferences,
  type Recommendation,
  type Tea,
} from './types';

const AFFILIATE_NOTE =
  'Werbung/Affiliate-Link: Bei Kauf erhalten wir ggf. eine Provision, für dich ändert sich der Preis nicht.';

const CAFFEINE_INFO: Record<Caffeine, { label: string; detail: string; level: number }> = {
  kein: { label: 'Keines', detail: 'koffeinfrei', level: 0 },
  niedrig: { label: 'Niedrig', detail: 'etwa 15–30 mg je Tasse', level: 1 },
  mittel: { label: 'Mittel', detail: 'etwa 20–45 mg je Tasse', level: 2 },
  hoch: { label: 'Hoch', detail: 'etwa 40–70 mg je Tasse', level: 3 },
};

const COUNT_TEXT = ['', 'Ein Tee liegt vorn.', 'Zwei Tees passen gut.', 'Drei Tees zur Auswahl.'];

function required<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Element fehlt: ${selector}`);
  return node;
}

const finder = required<HTMLFormElement>('#finder');
const tasteField = required<HTMLFieldSetElement>('#geschmack');
const timeField = required<HTMLFieldSetElement>('#tageszeit');
const moodField = required<HTMLFieldSetElement>('#richtung');
const caffeineField = required<HTMLFieldSetElement>('#koffein');
const formError = required<HTMLParagraphElement>('#form-error');
const auswahl = required<HTMLElement>('#auswahl');
const ergebnis = required<HTMLElement>('#ergebnis');
const ergebnisTitel = required<HTMLHeadingElement>('#ergebnis-titel');
const ergebnisLead = required<HTMLParagraphElement>('#ergebnis-lead');
const ergebnisListe = required<HTMLElement>('#ergebnis-liste');
const zurueck = required<HTMLButtonElement>('#zurueck');
const findeTee = required<HTMLAnchorElement>('#finde-tee');

findeTee.addEventListener('click', (event) => {
  event.preventDefault();
  tasteField.focus({ preventScroll: true });
  scrollTo(finder);
});

finder.addEventListener('submit', (event) => {
  event.preventDefault();
  const prefs = readPreferences();
  if (!prefs) return;
  showResults(recommend(prefs), prefs);
});

bindMoodToggle();

zurueck.addEventListener('click', () => {
  ergebnis.hidden = true;
  auswahl.hidden = false;
  tasteField.focus();
  scrollTo(auswahl);
});

function checkedValue(group: string): string | undefined {
  return finder.querySelector<HTMLInputElement>(`input[data-group="${group}"]:checked`)?.value;
}

function checkedValues<T extends string>(group: string, allowed: readonly T[]): T[] {
  return [...finder.querySelectorAll<HTMLInputElement>(`input[data-group="${group}"]:checked`)]
    .map((input) => input.value)
    .filter((value): value is T => (allowed as readonly string[]).includes(value));
}

/** Richtung bleibt eine Einfachauswahl, lässt sich aber wieder leeren. */
function bindMoodToggle(): void {
  const inputs = [...moodField.querySelectorAll<HTMLInputElement>('input[data-group="mood"]')];
  let armed: HTMLInputElement | null = null;
  for (const input of inputs) {
    input.addEventListener('click', () => {
      if (armed === input) {
        input.checked = false;
        armed = null;
        return;
      }
      armed = input.checked ? input : null;
    });
    input.addEventListener('keydown', (event) => {
      if (event.key !== ' ' || !input.checked) return;
      event.preventDefault();
      input.checked = false;
      if (armed === input) armed = null;
    });
  }
}

function readPreferences(): Preferences | null {
  const tastes = checkedValues('taste', TASTES);
  const times = checkedValues('time', TIMES);
  const moodValue = checkedValue('mood');
  const caffeineValue = checkedValue('caffeine');
  const mood = (MOODS as readonly string[]).includes(moodValue ?? '') ? (moodValue as Mood) : null;
  const caffeine = (CAFFEINE_CHOICES as readonly string[]).includes(caffeineValue ?? '')
    ? (caffeineValue as CaffeineChoice)
    : null;

  tasteField.setAttribute('aria-invalid', tastes.length ? 'false' : 'true');
  timeField.setAttribute('aria-invalid', times.length ? 'false' : 'true');
  moodField.setAttribute('aria-invalid', 'false');
  caffeineField.setAttribute('aria-invalid', caffeine ? 'false' : 'true');

  const missing: string[] = [];
  if (!tastes.length) missing.push('mindestens einen Geschmack');
  if (!times.length) missing.push('mindestens eine Tageszeit');
  if (!caffeine) missing.push('eine Koffein-Auswahl');

  if (missing.length || !caffeine) {
    formError.textContent = `Bitte wähle ${joinDe(missing)}.`;
    formError.hidden = false;
    const focusTarget = !tastes.length ? tasteField : !times.length ? timeField : caffeineField;
    focusTarget.focus();
    return null;
  }

  formError.hidden = true;
  return { tastes, times, mood, caffeine };
}

function showResults(items: Recommendation[], prefs: Preferences): void {
  const tasteText = joinDe(prefs.tastes.map((taste) => capitalizeDe(TASTE_LABEL[taste])));
  const timeText = joinDe(prefs.times.map((time) => TIME_LABEL[time]));
  const moodText = prefs.mood ? `, Richtung ${MOOD_LABEL[prefs.mood]}` : '';
  const count = items.length
    ? (COUNT_TEXT[items.length] ?? '')
    : 'Dazu liegt kein Tee im Satz.';
  ergebnisLead.textContent = `Für ${tasteText} am ${timeText}${moodText}, ${CAFFEINE_CHOICE_LABEL[prefs.caffeine]}. ${count}`;
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

  const meta = document.createElement('p');
  meta.className = 'tea-meta';
  meta.textContent = `${tea.type} · ${tea.origin}`;

  card.append(renderArt(), body);
  body.append(rank, title, meta);

  if (item.matchedTastes.length) {
    const tags = document.createElement('ul');
    tags.className = 'tags';
    for (const taste of item.matchedTastes) {
      const tag = document.createElement('li');
      tag.textContent = TASTE_LABEL[taste];
      tags.append(tag);
    }
    body.append(tags);
  }

  const reason = document.createElement('p');
  reason.className = 'tea-reason';
  reason.textContent = item.reason;

  const brew = document.createElement('dl');
  brew.className = 'brew';
  brew.setAttribute('aria-label', `Zubereitung ${tea.name}`);
  brew.append(
    brewItem('Temperatur', tea.temperature),
    brewItem('Ziehzeit', tea.steepTime),
    brewItem('Menge', tea.amount),
  );

  body.append(reason, brew);

  if (tea.brewNote) {
    const note = document.createElement('p');
    note.className = 'brew-note';
    note.textContent = tea.brewNote;
    body.append(note);
  }

  body.append(caffeineLine(tea.caffeine, tea.caffeineDetail), renderPurchase(tea));
  return card;
}

function renderPurchase(tea: Tea): HTMLElement {
  const block = document.createElement('div');
  block.className = 'tea-buy';

  const link = document.createElement('a');
  link.className = 'btn btn-primary';
  link.href = `/go/${tea.id}`;
  link.textContent = 'Hier kaufen';
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'sponsored noopener');
  link.setAttribute('aria-label', `Hier kaufen: ${tea.name}`);

  const hint = document.createElement('p');
  hint.className = 'affiliate-note';
  hint.id = `affiliate-${tea.id}`;
  hint.textContent = AFFILIATE_NOTE;
  link.setAttribute('aria-describedby', hint.id);

  block.append(link, hint);
  return block;
}

function brewItem(label: string, value: string): HTMLElement {
  const wrap = document.createElement('div');
  const term = document.createElement('dt');
  term.textContent = label;
  const detail = document.createElement('dd');
  detail.textContent = value;
  wrap.append(term, detail);
  return wrap;
}

function caffeineLine(level: Caffeine, custom?: string): HTMLElement {
  const info = CAFFEINE_INFO[level];
  const line = document.createElement('p');
  line.className = 'caffeine';

  const meter = document.createElement('span');
  meter.className = 'meter';
  meter.setAttribute('aria-hidden', 'true');
  for (let step = 1; step <= 3; step += 1) {
    const dot = document.createElement('span');
    dot.className = step <= info.level ? 'meter-on' : 'meter-off';
    meter.append(dot);
  }

  const text = document.createElement('span');
  if (!CAFFEINE_LEVELS.includes(level)) {
    text.textContent = 'Koffein: keine Angabe';
  } else if (level === 'kein') {
    text.textContent = 'Koffein: keines';
  } else {
    text.textContent = `Koffein: ${info.label} · ${custom ?? info.detail}`;
  }

  line.append(meter, text);
  return line;
}

function scrollTo(node: HTMLElement): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}
