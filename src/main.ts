import './analytics';
import { initHeader } from './header';
import { initMixer } from './mixer-ui';
import { initReveal } from './reveal';
import { MOMENT_LINE } from './tea-copy';
import { contradictionHints, recommend } from './recommender';
import {
  CAFFEINE_CHOICES,
  CAFFEINE_CHOICE_LABEL,
  CARE_NOTE,
  OCCASIONS,
  OCCASION_LABEL,
  TASTES,
  TASTE_LABEL,
  caffeineFact,
  capitalizeDe,
  joinDe,
  preparationFact,
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

const careNotes = document.querySelectorAll<HTMLElement>('[data-care-note]');
for (const note of careNotes) note.textContent = CARE_NOTE;

initHeader();
initReveal();
initDiscover();
initMixer();

const finderForm = document.querySelector<HTMLFormElement>('#finder');
if (finderForm) mountFinder(finderForm);

function mountFinder(finder: HTMLFormElement): void {
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
  const progressFill = required<HTMLElement>('#progress-fill');
  const progressText = required<HTMLElement>('#progress-text');

  const stepNodes = {
    moment: required<HTMLElement>('[data-step="moment"]'),
    taste: required<HTMLElement>('[data-step="taste"]'),
    caffeine: required<HTMLElement>('[data-step="caffeine"]'),
  };

  let tasteSkipped = false;

  finder.addEventListener('submit', (event) => {
    event.preventDefault();
    const prefs = readPreferences();
    if (!prefs) return;
    if (prefs.tastes.length === 0) tasteSkipped = true;
    updateProgress();
    showResults(recommend(prefs), prefs);
  });

  finder.addEventListener('change', () => {
    formError.hidden = true;
    occasionField.setAttribute('aria-invalid', 'false');
    updateProgress();
  });

  caffeineField.addEventListener('focusin', () => {
    if (checkedValues('taste', TASTES).length === 0) tasteSkipped = true;
    updateProgress();
  });

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-action="zurueck"]')) {
    button.addEventListener('click', () => showForm(occasionField));
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-action="neu"]')) {
    button.addEventListener('click', () => {
      finder.reset();
      tasteSkipped = false;
      for (const field of [occasionField, tasteField, caffeineField]) {
        field.setAttribute('aria-invalid', 'false');
      }
      formError.hidden = true;
      updateProgress();
      showForm(occasionField);
    });
  }

  updateProgress();

  function showForm(focusTarget: HTMLElement): void {
    ergebnis.hidden = true;
    ergebnis.classList.remove('is-in');
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
      formError.textContent = 'Bitte wähle mindestens einen Moment.';
      formError.hidden = false;
      occasionField.focus();
      return null;
    }

    formError.hidden = true;
    return { occasions, tastes, caffeine };
  }

  function updateProgress(): void {
    const momentDone = checkedValues('occasion', OCCASIONS).length > 0;
    const tasteDone = checkedValues('taste', TASTES).length > 0 || tasteSkipped;
    const current = !momentDone ? 'moment' : !tasteDone ? 'taste' : 'caffeine';
    const stateOf = (step: 'moment' | 'taste' | 'caffeine'): string => {
      if (step === 'moment') return momentDone ? 'done' : 'current';
      if (step === 'taste') {
        if (!momentDone) return 'idle';
        return tasteDone ? 'done' : 'current';
      }
      return momentDone && tasteDone ? 'done' : 'idle';
    };
    progressFill.style.width = current === 'moment' ? '33%' : current === 'taste' ? '66%' : '100%';
    for (const key of ['moment', 'taste', 'caffeine'] as const) {
      const node = stepNodes[key];
      node.dataset.state = stateOf(key);
      if (key === current) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
    }
    const labels = { moment: 'Moment', taste: 'Geschmack', caffeine: 'Koffein' };
    const index = current === 'moment' ? 1 : current === 'taste' ? 2 : 3;
    progressText.textContent = `Schritt ${index} von 3: ${labels[current]}`;
  }

  function showResults(items: Recommendation[], prefs: Preferences): void {
    const momentText = joinDe(prefs.occasions.map((occasion) => OCCASION_LABEL[occasion]));
    const tasteText = prefs.tastes.length
      ? ` Geschmack: ${joinDe(prefs.tastes.map((taste) => capitalizeDe(TASTE_LABEL[taste])))}.`
      : '';
    const count = items.length ? (COUNT_TEXT[items.length] ?? '') : 'Dazu liegt kein Tee im Satz.';
    ergebnisLead.textContent = `${count} Moment: ${momentText}.${tasteText} ${capitalizeDe(CAFFEINE_CHOICE_LABEL[prefs.caffeine])}.`;
    const hints = contradictionHints(prefs);
    ergebnisHinweis.textContent = hints.join(' ');
    ergebnisHinweis.hidden = hints.length === 0;
    ergebnisListe.dataset.count = String(items.length);
    ergebnisListe.replaceChildren(...items.map((item) => renderCard(item)));
    auswahl.hidden = true;
    ergebnis.hidden = false;
    ergebnis.classList.add('is-in');
    ergebnisTitel.focus();
    scrollTo(ergebnis);
  }
}

function renderCard(item: Recommendation): HTMLElement {
  const { tea } = item;
  const card = document.createElement('article');
  card.className = 'tea-card';
  card.dataset.type = tea.type;
  card.dataset.tea = tea.id;

  const body = document.createElement('div');
  body.className = 'tea-body';

  const kind = document.createElement('p');
  kind.className = 'tea-kind';
  kind.textContent = tea.type;

  const title = document.createElement('h3');
  title.textContent = tea.name;

  const line = document.createElement('p');
  line.className = 'tea-line';
  line.textContent = MOMENT_LINE[tea.id] ?? tea.summary;

  card.append(body);
  body.append(kind, title, line, renderFacts(tea), renderPurchase(tea));
  return card;
}

function renderFacts(tea: Tea): HTMLElement {
  const facts = document.createElement('dl');
  facts.className = 'facts';
  facts.setAttribute('aria-label', `Fakten ${tea.name}`);
  const rows = [factItem('Zubereitung', preparationFact(tea)), factItem('Koffein', caffeineFact(tea.caffeine))];
  const ingredients = tea.ingredients?.trim();
  if (ingredients) rows.push(factItem('Zutaten', ingredients));
  facts.append(...rows);
  return facts;
}

function initDiscover(): void {
  for (const rest of document.querySelectorAll<HTMLElement>('.discover-rest')) {
    const button = document.querySelector<HTMLButtonElement>(`[aria-controls="${CSS.escape(rest.id)}"]`);
    if (!button) continue;
    const extra = rest.querySelectorAll('.tea-card').length;
    const collapse = (): void => {
      if (rest.contains(document.activeElement)) button.focus();
      rest.classList.add('is-collapsed');
      rest.setAttribute('aria-hidden', 'true');
      rest.inert = true;
      button.setAttribute('aria-expanded', 'false');
      button.textContent = `Alle anzeigen (${extra})`;
    };
    const expand = (): void => {
      rest.classList.remove('is-collapsed');
      rest.removeAttribute('aria-hidden');
      rest.inert = false;
      button.setAttribute('aria-expanded', 'true');
      button.textContent = 'Weniger anzeigen';
    };
    button.hidden = false;
    collapse();
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-expanded') === 'true') collapse();
      else expand();
    });
  }
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

  const tag = document.createElement('p');
  tag.className = 'ad-tag';
  tag.textContent = 'Werbung';

  const link = renderBuyLink(tea, hintId);
  const hint = document.createElement('p');
  hint.className = 'affiliate-note';
  hint.id = hintId;
  hint.textContent = AFFILIATE_NOTE;

  block.append(tag, link, hint);
  return block;
}

function scrollTo(node: HTMLElement): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}
