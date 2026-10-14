import { recommend } from './recommender';
import {
  CAFFEINE_LEVELS,
  TASTES,
  TASTE_LABEL,
  TIMES,
  TIME_LABEL,
  capitalizeDe,
  joinDe,
  type Caffeine,
  type Preferences,
  type Recommendation,
  type Taste,
  type TimeOfDay,
} from './types';

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
const formError = required<HTMLParagraphElement>('#form-error');
const auswahl = required<HTMLElement>('#auswahl');
const ergebnis = required<HTMLElement>('#ergebnis');
const ergebnisTitel = required<HTMLHeadingElement>('#ergebnis-titel');
const ergebnisLead = required<HTMLParagraphElement>('#ergebnis-lead');
const ergebnisListe = required<HTMLElement>('#ergebnis-liste');
const zurueck = required<HTMLButtonElement>('#zurueck');

finder.addEventListener('submit', (event) => {
  event.preventDefault();
  const prefs = readPreferences();
  if (!prefs) return;
  showResults(recommend(prefs), prefs);
});

zurueck.addEventListener('click', () => {
  ergebnis.hidden = true;
  auswahl.hidden = false;
  tasteField.focus();
  scrollTo(auswahl);
});

function readPreferences(): Preferences | null {
  const tastes = [
    ...finder.querySelectorAll<HTMLInputElement>('input[data-group="taste"]:checked'),
  ]
    .map((input) => input.value)
    .filter((value): value is Taste => (TASTES as readonly string[]).includes(value));
  const timeValue = finder.querySelector<HTMLInputElement>('input[data-group="time"]:checked')?.value;
  const time = (TIMES as readonly string[]).includes(timeValue ?? '') ? (timeValue as TimeOfDay) : null;

  tasteField.setAttribute('aria-invalid', tastes.length ? 'false' : 'true');
  timeField.setAttribute('aria-invalid', time ? 'false' : 'true');

  if (!tastes.length || !time) {
    const message =
      !tastes.length && !time
        ? 'Bitte wähle mindestens einen Geschmack und eine Tageszeit.'
        : !tastes.length
          ? 'Bitte wähle mindestens einen Geschmack.'
          : 'Bitte wähle eine Tageszeit.';
    formError.textContent = message;
    formError.hidden = false;
    (tastes.length ? timeField : tasteField).focus();
    return null;
  }

  formError.hidden = true;
  return { tastes, time };
}

function showResults(items: Recommendation[], prefs: Preferences): void {
  const tasteText = joinDe(prefs.tastes.map((taste) => capitalizeDe(TASTE_LABEL[taste])));
  const count = COUNT_TEXT[items.length] ?? '';
  ergebnisLead.textContent = `Für ${tasteText} am ${TIME_LABEL[prefs.time]}. ${count}`;
  ergebnisListe.replaceChildren(...items.map((item, index) => renderCard(item, index)));
  auswahl.hidden = true;
  ergebnis.hidden = false;
  ergebnisTitel.focus();
  scrollTo(ergebnis);
}

function renderCard(item: Recommendation, index: number): HTMLElement {
  const { tea } = item;
  const card = document.createElement('article');
  card.className = 'tea-card';
  card.dataset.type = tea.type;

  const rank = document.createElement('p');
  rank.className = 'tea-rank';
  rank.textContent = `Vorschlag ${index + 1}`;

  const title = document.createElement('h3');
  title.textContent = tea.name;

  const meta = document.createElement('p');
  meta.className = 'tea-meta';
  meta.textContent = `${tea.type} · ${tea.origin}`;

  card.append(rank, title, meta);

  if (item.matchedTastes.length) {
    const tags = document.createElement('ul');
    tags.className = 'tags';
    for (const taste of item.matchedTastes) {
      const tag = document.createElement('li');
      tag.textContent = TASTE_LABEL[taste];
      tags.append(tag);
    }
    card.append(tags);
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

  card.append(reason, brew);

  if (tea.brewNote) {
    const note = document.createElement('p');
    note.className = 'brew-note';
    note.textContent = tea.brewNote;
    card.append(note);
  }

  card.append(caffeineLine(tea.caffeine, tea.caffeineDetail));
  return card;
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
