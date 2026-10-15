export const TASTES = ['fruchtig', 'blumig', 'herb', 'kraeftig'] as const;
export type Taste = (typeof TASTES)[number];

export const TIMES = ['morgen', 'mittag', 'nachmittag', 'abend'] as const;
export type TimeOfDay = (typeof TIMES)[number];

export const MOODS = ['fokus', 'verdauung', 'beruhigung', 'schlaf'] as const;
export type Mood = (typeof MOODS)[number];

export const CAFFEINE_LEVELS = ['kein', 'niedrig', 'mittel', 'hoch'] as const;
export type Caffeine = (typeof CAFFEINE_LEVELS)[number];

export const CAFFEINE_CHOICES = ['ja', 'nein', 'egal'] as const;
export type CaffeineChoice = (typeof CAFFEINE_CHOICES)[number];

export type Tea = {
  id: string;
  name: string;
  type: string;
  origin: string;
  summary: string;
  tastes: Partial<Record<Taste, number>>;
  times: Partial<Record<TimeOfDay, number>>;
  /** Passung zu einer Richtung, 1–3. Geschmacksorientierung, keine Gesundheitsaussage. */
  moods: Partial<Record<Mood, number>>;
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
  /** Mindestens eine Tageszeit. Mehrere sind erlaubt. */
  times: TimeOfDay[];
  /** `null`, wenn „Wofür suchst du Tee?“ leer bleibt. */
  mood: Mood | null;
  caffeine: CaffeineChoice;
};

export type Recommendation = {
  tea: Tea;
  score: number;
  reason: string;
  matchedTastes: Taste[];
  matchedMood: boolean;
};

export const TASTE_LABEL: Record<Taste, string> = {
  fruchtig: 'fruchtig',
  blumig: 'blumig',
  herb: 'herb',
  kraeftig: 'kräftig',
};

export const TIME_LABEL: Record<TimeOfDay, string> = {
  morgen: 'Morgen',
  mittag: 'Mittag',
  nachmittag: 'Nachmittag',
  abend: 'Abend',
};

export const MOOD_LABEL: Record<Mood, string> = {
  fokus: 'Fokus',
  verdauung: 'Verdauung',
  beruhigung: 'Beruhigung',
  schlaf: 'Schlaf',
};

export const DIRECTION_PHRASE = 'häufig mit dieser Richtung verbunden';

export const CAFFEINE_CHOICE_LABEL: Record<CaffeineChoice, string> = {
  ja: 'mit Koffein',
  nein: 'ohne Koffein',
  egal: 'Koffein egal',
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
