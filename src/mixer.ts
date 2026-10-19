import { caffeineFact, type Tea } from './types';

export const MAX_INGREDIENTS = 5;

export type MixItem = {
  id: string;
  percent: number;
};

export const MIXER_TEXT = {
  empty: 'Wähle bis zu fünf Teesorten.',
  limit: 'Höchstens fünf Zutaten.',
  sum: 'Die Anteile bleiben zusammen bei 100 %.',
  preview: 'Nichts wird bestellt oder gespeichert.',
  remove: 'Entfernen',
  ingredients: 'Zutaten',
  taste: 'Geschmack',
  caffeine: 'Koffein',
  barsNote: 'Die Balken zeigen Würze, Minze, Frucht und süßlichen Anteil aus dem Datensatz.',
} as const;

/**
 * Frisch liegt im Datensatz als minzig, süßlich als Gewicht des Moments „Etwas Süßes“.
 * Weitere Felder gibt es dafür nicht.
 */
const AXES: readonly { label: string; read: (tea: Tea) => number }[] = [
  { label: 'Würzig', read: (tea) => tea.tastes.wuerzig ?? 0 },
  { label: 'Frisch', read: (tea) => tea.tastes.minzig ?? 0 },
  { label: 'Fruchtig', read: (tea) => tea.tastes.fruchtig ?? 0 },
  { label: 'Süßlich', read: (tea) => tea.occasions.suesses ?? 0 },
];

function apportion(total: number, weights: readonly number[]): number[] {
  if (weights.length === 0) return [];
  const safe = weights.map((weight) => Math.max(0, weight));
  const sum = safe.reduce((acc, weight) => acc + weight, 0);
  const basis = sum === 0 ? safe.map(() => 1) : safe;
  const basisSum = basis.reduce((acc, weight) => acc + weight, 0);
  const raw = basis.map((weight) => (total * weight) / basisSum);
  const floors = raw.map((value) => Math.floor(value));
  let left = total - floors.reduce((acc, value) => acc + value, 0);
  const order = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index);
  for (const entry of order) {
    if (left <= 0) break;
    floors[entry.index] = (floors[entry.index] ?? 0) + 1;
    left -= 1;
  }
  return floors;
}

function scaleTo100(items: readonly MixItem[]): MixItem[] {
  if (items.length === 0) return [];
  const shares = apportion(100, items.map((item) => item.percent));
  return items.map((item, index) => ({ id: item.id, percent: shares[index] ?? 0 }));
}

export function mixSum(items: readonly MixItem[]): number {
  return items.reduce((sum, item) => sum + item.percent, 0);
}

export function addIngredient(items: readonly MixItem[], id: string): MixItem[] | null {
  if (items.some((item) => item.id === id) || items.length >= MAX_INGREDIENTS) return null;
  const withNew = [...items, { id, percent: 0 }];
  return setPercent(withNew, id, Math.floor(100 / withNew.length));
}

export function removeIngredient(items: readonly MixItem[], id: string): MixItem[] {
  return scaleTo100(items.filter((item) => item.id !== id));
}

export function setPercent(items: readonly MixItem[], id: string, next: number): MixItem[] {
  if (!items.some((item) => item.id === id)) return items.map((item) => ({ ...item }));
  if (items.length === 1) return [{ id, percent: 100 }];
  const clamped = Math.round(Math.min(100, Math.max(0, next)));
  const others = items.filter((item) => item.id !== id);
  const shares = apportion(100 - clamped, others.map((item) => item.percent));
  return items.map((item) => {
    if (item.id === id) return { id, percent: clamped };
    const index = others.findIndex((entry) => entry.id === item.id);
    return { id: item.id, percent: shares[index] ?? 0 };
  });
}

export type MixBar = { label: string; percent: number };
export type MixLine = { id: string; name: string; percent: number };

export type MixView = {
  lines: MixLine[];
  bars: MixBar[];
  caffeine: 'Enthält Koffein' | 'Koffeinfrei' | null;
};

export function mixView(items: readonly MixItem[], teas: readonly Tea[]): MixView {
  const byId = new Map(teas.map((tea) => [tea.id, tea]));
  const lines = items
    .map((item) => {
      const tea = byId.get(item.id);
      return { id: item.id, name: tea?.name ?? item.id, percent: item.percent };
    })
    .sort((a, b) => b.percent - a.percent || a.name.localeCompare(b.name, 'de'));

  const bars = AXES.map((axis) => {
    const weighted = items.reduce((sum, item) => {
      const tea = byId.get(item.id);
      if (!tea || item.percent <= 0) return sum;
      return sum + axis.read(tea) * item.percent;
    }, 0);
    const value = items.length ? weighted / 100 : 0;
    return { label: axis.label, percent: Math.round((value / 3) * 100) };
  });

  const present = items.filter((item) => item.percent > 0);
  if (present.length === 0) return { lines, bars, caffeine: null };
  const hasCaffeine = present.some((item) => {
    const tea = byId.get(item.id);
    return tea ? tea.caffeine !== 'kein' : false;
  });
  return { lines, bars, caffeine: caffeineFact(hasCaffeine ? 'hoch' : 'kein') };
}
