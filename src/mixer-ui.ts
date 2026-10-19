import { MIXER_TEXT, addIngredient, mixView, removeIngredient, setPercent, type MixItem } from './mixer';
import { teas } from './recommender';

export function initMixer(): void {
  const picker = document.querySelector<HTMLElement>('#mixer-tees');
  const empty = document.querySelector<HTMLElement>('#mixer-empty');
  const detail = document.querySelector<HTMLElement>('#mixer-detail');
  const lines = document.querySelector<HTMLElement>('#mixer-lines');
  const sliders = document.querySelector<HTMLElement>('#mixer-sliders');
  const bars = document.querySelector<HTMLElement>('#mixer-bars');
  const caffeine = document.querySelector<HTMLElement>('#mixer-caffeine');
  if (!picker || !empty || !detail || !lines || !sliders || !bars || !caffeine) return;

  const pickerEl = picker;
  const emptyEl = empty;
  const detailEl = detail;
  const linesEl = lines;
  const slidersEl = sliders;
  const barsEl = bars;
  const caffeineEl = caffeine;

  let items: MixItem[] = [];
  const sorted = [...teas].sort((a, b) => a.name.localeCompare(b.name, 'de'));

  pickerEl.replaceChildren(
    ...sorted.map((tea) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chip chip-compact mix-pick';
      button.dataset.mixId = tea.id;
      button.textContent = tea.name;
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        const selected = items.some((item) => item.id === tea.id);
        if (selected) items = removeIngredient(items, tea.id);
        else {
          const next = addIngredient(items, tea.id);
          if (!next) return;
          items = next;
        }
        renderSliders();
        paint(tea.id);
      });
      return button;
    }),
  );

  function paint(focusId?: string): void {
    const view = mixView(items, teas);
    const full = items.length >= 5;
    for (const button of pickerEl.querySelectorAll<HTMLButtonElement>('[data-mix-id]')) {
      const on = items.some((item) => item.id === button.dataset.mixId);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
      button.disabled = full && !on;
    }

    emptyEl.hidden = items.length > 0;
    detailEl.hidden = items.length === 0;

    linesEl.replaceChildren(
      ...view.lines.map((line) => {
        const item = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = line.name;
        const share = document.createElement('span');
        share.textContent = `${line.percent} %`;
        item.append(name, share);
        return item;
      }),
    );

    for (const item of items) {
      const range = document.getElementById(`mix-range-${item.id}`) as HTMLInputElement | null;
      const share = document.querySelector<HTMLElement>(`[data-mix-share="${item.id}"]`);
      if (share) share.textContent = `${item.percent} %`;
      if (!range) continue;
      range.value = String(item.percent);
      range.setAttribute('aria-valuetext', `${item.percent} Prozent`);
      range.disabled = items.length === 1;
    }

    barsEl.replaceChildren(
      ...view.bars.map((bar) => {
        const row = document.createElement('div');
        row.className = 'bar-row';
        const name = document.createElement('span');
        name.textContent = bar.label;
        const track = document.createElement('span');
        track.className = 'bar-track';
        track.setAttribute('role', 'img');
        track.setAttribute('aria-label', `${bar.label} ${bar.percent} Prozent`);
        const fill = document.createElement('span');
        fill.className = 'bar-fill';
        fill.style.width = `${bar.percent}%`;
        track.append(fill);
        const share = document.createElement('span');
        share.textContent = `${bar.percent} %`;
        row.append(name, track, share);
        return row;
      }),
    );

    caffeineEl.textContent = view.caffeine ?? '';
    if (focusId) document.getElementById(`mix-range-${focusId}`)?.focus();
  }

  function renderSliders(): void {
    slidersEl.replaceChildren(
      ...items.map((item) => {
        const tea = teas.find((entry) => entry.id === item.id);
        const name = tea?.name ?? item.id;
        const block = document.createElement('div');
        block.className = 'mix-slider';

        const label = document.createElement('label');
        label.htmlFor = `mix-range-${item.id}`;
        label.textContent = name;

        const share = document.createElement('span');
        share.dataset.mixShare = item.id;
        share.textContent = `${item.percent} %`;

        const range = document.createElement('input');
        range.type = 'range';
        range.id = `mix-range-${item.id}`;
        range.min = '0';
        range.max = '100';
        range.step = '1';
        range.value = String(item.percent);
        range.addEventListener('input', () => {
          items = setPercent(items, item.id, Number(range.value));
          paint();
        });

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn btn-ghost mix-remove';
        remove.textContent = MIXER_TEXT.remove;
        remove.setAttribute('aria-label', `${name} entfernen`);
        remove.addEventListener('click', () => {
          items = removeIngredient(items, item.id);
          renderSliders();
          paint();
        });

        block.append(label, share, range, remove);
        return block;
      }),
    );
  }
}
