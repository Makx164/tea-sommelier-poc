export const TASTES = [
  'kraeutig',
  'blumig',
  'fruchtig',
  'wuerzig',
  'malzig',
  'mild',
  'rauchig',
  'minzig',
] as const;
export type Taste = (typeof TASTES)[number];

export const TIMES = ['morgen', 'mittag', 'nachmittag', 'abend'] as const;
export type TimeOfDay = (typeof TIMES)[number];

/** Anlässe in Schritt 1. Mehrfachauswahl, mindestens einer. */
export const OCCASIONS = [
  'abends',
  'wach',
  'entspannen',
  'nach_essen',
  'erfrischen',
  'waermen',
  'suesses',
  'sport',
  'arbeit',
  'start',
  'schmuddel',
] as const;
export type Occasion = (typeof OCCASIONS)[number];

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
  /** Passung zu einem Anlass, 1–3. Traditioneller Trinkmoment, keine Gesundheitsaussage. */
  occasions: Partial<Record<Occasion, number>>;
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
  /** Mindestens ein Anlass. Mehrere sind erlaubt. */
  occasions: Occasion[];
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
  matchedOccasions: Occasion[];
  matchedMood: boolean;
};

export const TASTE_LABEL: Record<Taste, string> = {
  kraeutig: 'kräutig',
  blumig: 'blumig',
  fruchtig: 'fruchtig',
  wuerzig: 'würzig',
  malzig: 'malzig',
  mild: 'mild',
  rauchig: 'rauchig',
  minzig: 'minzig',
};

export const TIME_LABEL: Record<TimeOfDay, string> = {
  morgen: 'Morgen',
  mittag: 'Mittag',
  nachmittag: 'Nachmittag',
  abend: 'Abend',
};

export const OCCASION_LABEL: Record<Occasion, string> = {
  abends: 'Abends runterkommen',
  wach: 'Wach werden',
  entspannen: 'Entspannen',
  nach_essen: 'Nach dem Essen',
  erfrischen: 'Erfrischen',
  waermen: 'Wärmen',
  suesses: 'Lust auf Süßes',
  sport: 'Nach dem Sport',
  arbeit: 'Konzentriert arbeiten',
  start: 'Guter Start in den Tag',
  schmuddel: 'Gemütlich bei Schmuddelwetter',
};

export const OCCASION_EMOJI: Record<Occasion, string> = {
  abends: '😴',
  wach: '⚡',
  entspannen: '🧘',
  nach_essen: '🍽️',
  erfrischen: '🧊',
  waermen: '🔥',
  suesses: '🍰',
  sport: '🏃',
  arbeit: '💻',
  start: '☀️',
  schmuddel: '🤧',
};

export const MOOD_LABEL: Record<Mood, string> = {
  fokus: 'Fokus',
  verdauung: 'Verdauung',
  beruhigung: 'Beruhigung',
  schlaf: 'Schlaf',
};

export const DIRECTION_PHRASE = 'häufig mit dieser Richtung verbunden';

/** Koffein in den Faktkacheln: keins, wenig, mittel, viel. */
export const CAFFEINE_TILE_LABEL: Record<Caffeine, string> = {
  kein: 'keins',
  niedrig: 'wenig',
  mittel: 'mittel',
  hoch: 'viel',
};

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
