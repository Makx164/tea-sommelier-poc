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

/** Momente in Schritt 1. Mehrfachauswahl, mindestens einer. */
export const OCCASIONS = [
  'fokus',
  'abend',
  'nach_essen',
  'aufwaermen',
  'erfrischen',
  'suesses',
] as const;
export type Occasion = (typeof OCCASIONS)[number];

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
  /** Passung zu einem Moment, 1–3. Aus den früheren Anlass-Gewichten übernommen. */
  occasions: Partial<Record<Occasion, number>>;
  caffeine: Caffeine;
  /** Abweichende Orientierung, z. B. bei Matcha. Wird auf der Karte nicht gezeigt. */
  caffeineDetail?: string;
  temperature: string;
  steepTime: string;
  amount: string;
  brewNote?: string;
  /** Vollständige Zutatenliste, nur wenn sie im Produktdatensatz steht. */
  ingredients?: string;
};

export type Preferences = {
  /** Mindestens ein Moment. Mehrere sind erlaubt. Nur dieser Schritt ist Pflicht. */
  occasions: Occasion[];
  /** Leer ist erlaubt. */
  tastes: Taste[];
  caffeine: CaffeineChoice;
};

export type Recommendation = {
  tea: Tea;
  score: number;
  reason: string;
  matchedTastes: Taste[];
  matchedOccasions: Occasion[];
  matchedTimes: TimeOfDay[];
};

/**
 * Tageszeit kommt aus dem Moment, nicht aus einem eigenen Schritt.
 * Fokussierter Start ist Morgen, Abendritual ist Abend.
 */
export const OCCASION_TIME: Record<Occasion, TimeOfDay> = {
  fokus: 'morgen',
  abend: 'abend',
  nach_essen: 'mittag',
  aufwaermen: 'nachmittag',
  erfrischen: 'nachmittag',
  suesses: 'nachmittag',
};

export function timesForOccasions(occasions: readonly Occasion[]): TimeOfDay[] {
  const wanted = new Set<TimeOfDay>();
  for (const occasion of occasions) {
    const time = OCCASION_TIME[occasion];
    if (time) wanted.add(time);
  }
  return TIMES.filter((time) => wanted.has(time));
}

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
  fokus: 'Fokussierter Start',
  abend: 'Abendritual',
  nach_essen: 'Nach dem Essen',
  aufwaermen: 'Aufwärmen',
  erfrischen: 'Erfrischen & Aktiv',
  suesses: 'Etwas Süßes',
};

/** Einmalig an der Kachel, keine zweite Erklärung daneben. */
export const OCCASION_NOTE: Record<Occasion, string> = {
  fokus: 'Klar, kräftig, wach im Geschmack, Morgenritual',
  abend: 'Sanft, weich, ruhiger Ausklang',
  nach_essen: 'Frisch, aromatisch, Abschluss der Mahlzeit',
  aufwaermen: 'Würzig, heiß, kuschelig, für kalte Tage',
  erfrischen: 'Spritzig, frisch, nach dem Training, für unterwegs',
  suesses: 'Süßlich im Geschmack, ohne Zuckerzusatz',
};

/** Koffein auf der Karte, abgeleitet aus dem vorhandenen Stufenwert. */
export function caffeineFact(level: Caffeine): 'Enthält Koffein' | 'Koffeinfrei' {
  return level === 'kein' ? 'Koffeinfrei' : 'Enthält Koffein';
}

export const CAFFEINE_CHOICE_LABEL: Record<CaffeineChoice, string> = {
  ja: 'mit Koffein',
  nein: 'ohne Koffein',
  egal: 'Koffein egal',
};

export const CARE_NOTE =
  'Bei Schwangerschaft, Stillzeit oder Medikamenteneinnahme klär die Zutaten bitte mit Arzt, Ärztin oder Hebamme.';

export const AFFILIATE_NOTE =
  'Werbung/Affiliate-Link: Bei Kauf erhalten wir ggf. eine Provision, für dich ändert sich der Preis nicht.';

/** Nicht auf der Karte. Die Zutatenzeile erscheint nur bei befülltem `ingredients`. */
export const INGREDIENTS_GAP = 'liegt nicht vor';

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

export function preparationFact(tea: Pick<Tea, 'temperature' | 'steepTime'>): string {
  return `${tea.temperature}, ${tea.steepTime}`;
}
