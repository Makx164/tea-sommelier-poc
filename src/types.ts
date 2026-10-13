export const TASTES = ['herb', 'fruchtig', 'blumig', 'erdig', 'mild', 'kraeftig'] as const;
export type Taste = (typeof TASTES)[number];

export const TIMES = ['morgen', 'mittag', 'nachmittag', 'abend'] as const;
export type TimeOfDay = (typeof TIMES)[number];

export const CAFFEINE_LEVELS = ['kein', 'niedrig', 'mittel', 'hoch'] as const;
export type Caffeine = (typeof CAFFEINE_LEVELS)[number];

export type Tea = {
  id: string;
  name: string;
  type: string;
  origin: string;
  summary: string;
  tastes: Partial<Record<Taste, number>>;
  times: Partial<Record<TimeOfDay, number>>;
  caffeine: Caffeine;
  /** Abweichende Orientierung, z. B. bei Matcha. */
  caffeineDetail?: string;
  temperature: string;
  steepTime: string;
  amount: string;
  brewNote?: string;
};

export type Preferences = {
  tastes: Taste[];
  time: TimeOfDay;
};

export type Recommendation = {
  tea: Tea;
  score: number;
  reason: string;
  matchedTastes: Taste[];
};

export const TASTE_LABEL: Record<Taste, string> = {
  herb: 'herb',
  fruchtig: 'fruchtig',
  blumig: 'blumig',
  erdig: 'erdig',
  mild: 'mild',
  kraeftig: 'kräftig',
};

export const TIME_LABEL: Record<TimeOfDay, string> = {
  morgen: 'Morgen',
  mittag: 'Mittag',
  nachmittag: 'Nachmittag',
  abend: 'Abend',
};

export function joinDe(items: readonly string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0] ?? ''} und ${items[1] ?? ''}`;
  const last = items[items.length - 1] ?? '';
  return `${items.slice(0, -1).join(', ')} und ${last}`;
}

export function capitalizeDe(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLocaleUpperCase('de-DE') + text.slice(1);
}
