import './analytics';
import { initHeader } from './header';
import { initMixer } from './mixer-ui';
import { initReveal } from './reveal';
import { MOMENT_LINE } from './tea-copy';
import { contradictionHints, recommend } from './recommender';
import {
  CAFFEINE_CHOICES,
  CAFFEINE_CHOICE_LABEL,
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

const COUNT_TEXT = ['', 'Ein Tee liegt vorn.', 'Zwei Tees passen gut.', 'Drei Tees zur Auswahl.'];

function required<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Element fehlt: ${selector}`);
  return node;
}

initHeader();
initReveal();
initDiscover();
initTeaCards();
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
    const momentOn = checkedValues('occasion', OCCASIONS).length > 0;
    const tasteOn = checkedValues('taste', TASTES).length > 0;
    setFold(tasteField, momentOn);
    setFold(caffeineField, momentOn && tasteOn);
  }

  function setFold(field: HTMLFieldSetElement, open: boolean): void {
    field.closest('.step-fold')?.classList.toggle('is-open', open);
    field.inert = !open;
    if (open) field.removeAttribute('aria-hidden');
    else field.setAttribute('aria-hidden', 'true');
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
    bindTeaCards(ergebnisListe);
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

  const heading = document.createElement('h3');
  heading.className = 'tea-heading';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'tea-toggle';
  button.setAttribute('aria-expanded', 'false');
  const moreId = `mehr-ergebnis-${tea.id}`;
  button.setAttribute('aria-controls', moreId);

  const name = document.createElement('span');
  name.className = 'tea-name';
  name.textContent = tea.name;
  const kind = document.createElement('span');
  kind.className = 'tea-kind';
  kind.textContent = tea.type;
  const line = document.createElement('span');
  line.className = 'tea-line';
  line.textContent = MOMENT_LINE[tea.id] ?? tea.summary;
  button.append(name, kind, line);
  heading.append(button);

  const more = document.createElement('div');
  more.className = 'tea-more';
  more.id = moreId;
  const inner = document.createElement('div');
  inner.className = 'tea-more-inner';
  inner.append(prepLine(tea), caffeineLine(tea));
  const ingredients = tea.ingredients?.trim();
  if (ingredients) inner.append(ingredientLine(ingredients));
  inner.append(renderPurchase(tea));
  more.append(inner);
  card.append(heading, more);
  return card;
}

function prepLine(tea: Tea): HTMLElement {
  const line = document.createElement('p');
  line.className = 'tea-prep';
  const label = document.createElement('span');
  label.textContent = 'Zubereitung';
  line.append(label, document.createTextNode(` ${preparationFact(tea)}`));
  return line;
}

function caffeineLine(tea: Tea): HTMLElement {
  const line = document.createElement('p');
  line.className = 'tea-caffeine';
  line.textContent = caffeineFact(tea.caffeine);
  return line;
}

function ingredientLine(ingredients: string): HTMLElement {
  const line = document.createElement('p');
  line.className = 'tea-ingredients';
  const label = document.createElement('span');
  label.textContent = 'Zutaten';
  line.append(label, document.createTextNode(` ${ingredients}`));
  return line;
}

function initTeaCards(): void {
  bindTeaCards(document);
}

function bindTeaCards(root: ParentNode): void {
  for (const card of root.querySelectorAll<HTMLElement>('.tea-card')) {
    const button = card.querySelector<HTMLButtonElement>('.tea-toggle');
    if (!button || button.dataset.bound === '1') continue;
    button.dataset.bound = '1';
    button.addEventListener('click', () => {
      const open = card.classList.contains('is-open');
      if (open) {
        closeTeaCard(card);
        return;
      }
      for (const other of document.querySelectorAll<HTMLElement>('.tea-card.is-open')) {
        if (other !== card) closeTeaCard(other);
      }
      openTeaCard(card);
    });
  }
}

function openTeaCard(card: HTMLElement): void {
  card.classList.add('is-open');
  card.querySelector('.tea-toggle')?.setAttribute('aria-expanded', 'true');
}

function closeTeaCard(card: HTMLElement): void {
  if (card.contains(document.activeElement) && document.activeElement !== card.querySelector('.tea-toggle')) {
    card.querySelector<HTMLButtonElement>('.tea-toggle')?.focus();
  }
  card.classList.remove('is-open');
  card.querySelector('.tea-toggle')?.setAttribute('aria-expanded', 'false');
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

function renderBuyLink(tea: Tea): HTMLAnchorElement {
  const link = document.createElement('a');
  link.className = 'btn btn-primary';
  link.href = `/go/${tea.id}`;
  link.textContent = 'Hier kaufen';
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'sponsored noopener');
  link.setAttribute('aria-label', `Hier kaufen: ${tea.name}`);
  link.setAttribute('aria-describedby', 'affiliate-hinweis');
  return link;
}

function renderPurchase(tea: Tea): HTMLElement {
  const block = document.createElement('p');
  block.className = 'tea-buy';
  block.append(renderBuyLink(tea));
  return block;
}

function scrollTo(node: HTMLElement): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  node.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}
