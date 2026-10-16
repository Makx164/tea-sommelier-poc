import rawTeas from './data/teas.json';
import {
  CAFFEINE_CHOICES,
  CAFFEINE_LEVELS,
  OCCASIONS,
  OCCASION_LABEL,
  TASTES,
  TASTE_LABEL,
  TIMES,
  TIME_LABEL,
  joinDe,
  timesForOccasions,
  type Caffeine,
  type CaffeineChoice,
  type Occasion,
  type Preferences,
  type Recommendation,
  type Taste,
  type Tea,
  type TimeOfDay,
} from './types';

const TASTE_WEIGHT = 2.4;
const OCCASION_WEIGHT = 2.2;
const DIVERSE_RATIO = 0.6;

/**
 * Nur bei „Ja“ und ohne Abend-Anlass: Tageszeit verschiebt den Koffeingehalt.
 * „Egal“ bleibt ohne diese Verschiebung und sortiert nach der Punktzahl aus Anlass, Geschmack und Tageszeit.
 * „Abends runterkommen“ mit „Ja“ hebt stattdessen Tees mit wenig Koffein.
 */
const CAFFEINE_BIAS: Record<TimeOfDay, Record<Caffeine, number>> = {
  morgen: { hoch: 1.6, mittel: 0.9, niedrig: 0.1, kein: -0.3 },
  mittag: { hoch: 0.3, mittel: 0.6, niedrig: 0.4, kein: 0.3 },
  nachmittag: { hoch: -0.5, mittel: 0.6, niedrig: 0.9, kein: 0.6 },
  abend: { hoch: -3.4, mittel: -2.2, niedrig: 0.4, kein: 2.3 },
};

const LOW_CAFFEINE_LIFT: Record<Caffeine, number> = {
  kein: 0,
  niedrig: 2,
  mittel: 0,
  hoch: -2,
};

export const HINT_WITHOUT_CAFFEINE = 'Ohne Koffein eher belebend-frisch statt wach machend';
export const HINT_EVENING_WITH_CAFFEINE = 'Am Abend mit Koffein eher Tees mit wenig Koffein.';

const ALERT_OCCASIONS = new Set<Occasion>(['wach', 'arbeit']);

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} ist kein Objekt.`);
  }
  return value as Record<string, unknown>;
}

function asText(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} fehlt.`);
  return value;
}

function parseWeights<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string,
): Partial<Record<T, number>> {
  const record = asRecord(value, label);
  const weights: Partial<Record<T, number>> = {};
  for (const [key, weight] of Object.entries(record)) {
    if (!allowed.includes(key as T) || typeof weight !== 'number' || weight < 1 || weight > 3) {
      throw new Error(`${label}: ${key} ungültig.`);
    }
    weights[key as T] = weight;
  }
  return weights;
}

function parseTea(value: unknown, index: number): Tea {
  const raw = asRecord(value, `Tee ${index + 1}`);
  const id = asText(raw.id, `Tee ${index + 1} Id`);
  const caffeine = raw.caffeine;
  if (typeof caffeine !== 'string' || !CAFFEINE_LEVELS.includes(caffeine as Caffeine)) {
    throw new Error(`${id}: Koffein unbekannt.`);
  }
  const tastes = parseWeights(raw.tastes, TASTES, `${id} Geschmack`);
  const times = parseWeights(raw.times, TIMES, `${id} Tageszeit`);
  const occasions = parseWeights(raw.occasions, OCCASIONS, `${id} Anlass`);
  if (Object.keys(tastes).length === 0) throw new Error(`${id}: kein Geschmack.`);
  if (Object.keys(times).length === 0) throw new Error(`${id}: keine Tageszeit.`);
  if (Object.keys(occasions).length === 0) throw new Error(`${id}: kein Anlass.`);
  const tea: Tea = {
    id,
    name: asText(raw.name, `${id} Name`),
    type: asText(raw.type, `${id} Art`),
    origin: asText(raw.origin, `${id} Herkunft`),
    summary: asText(raw.summary, `${id} Beschreibung`),
    tastes,
    times,
    occasions,
    caffeine: caffeine as Caffeine,
    temperature: asText(raw.temperature, `${id} Temperatur`),
    steepTime: asText(raw.steepTime, `${id} Ziehzeit`),
    amount: asText(raw.amount, `${id} Menge`),
  };
  if (raw.caffeineDetail !== undefined) tea.caffeineDetail = asText(raw.caffeineDetail, `${id} Koffeintext`);
  if (raw.brewNote !== undefined) tea.brewNote = asText(raw.brewNote, `${id} Zubereitungshinweis`);
  return tea;
}

function parseTeas(raw: unknown): readonly Tea[] {
  if (!Array.isArray(raw)) throw new Error('Datensatz ist keine Liste.');
  const parsed = raw.map(parseTea);
  if (parsed.length < 20 || parsed.length > 30) {
    throw new Error(`Datensatz soll 20–30 Tees enthalten, hat ${parsed.length}.`);
  }
  const ids = new Set<string>();
  for (const tea of parsed) {
    if (ids.has(tea.id)) throw new Error(`Tee-Id doppelt: ${tea.id}`);
    ids.add(tea.id);
  }
  return parsed;
}

export const teas: readonly Tea[] = parseTeas(rawTeas);

function uniqueValues<T extends string>(values: readonly T[], allowed: readonly T[]): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  for (const value of values) {
    if (!allowed.includes(value) || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function knownValues<T extends string>(values: readonly T[], allowed: readonly T[], label: string): T[] {
  for (const value of values) {
    if (!allowed.includes(value)) throw new Error(`Unbekannte ${label}.`);
  }
  return uniqueValues(values, allowed);
}

export function normalizePreferences(prefs: Preferences): Preferences {
  if (!Array.isArray(prefs.occasions) || !Array.isArray(prefs.tastes)) {
    throw new Error('Auswahl unvollständig.');
  }
  const occasions = knownValues(prefs.occasions, OCCASIONS, 'Anlass');
  const tastes = knownValues(prefs.tastes, TASTES, 'Geschmack');
  if (occasions.length === 0) throw new Error('Mindestens ein Anlass ist nötig.');
  if (!CAFFEINE_CHOICES.includes(prefs.caffeine)) throw new Error('Unbekannte Koffein-Auswahl.');
  return { occasions, tastes, caffeine: prefs.caffeine };
}

function matchedWeight(tea: Tea, tastes: readonly Taste[]): number {
  return tastes.reduce((sum, taste) => sum + (tea.tastes[taste] ?? 0), 0);
}

function passesCaffeine(tea: Tea, choice: CaffeineChoice): boolean {
  if (choice === 'nein') return tea.caffeine === 'kein';
  if (choice === 'ja') return tea.caffeine !== 'kein';
  return true;
}

function average(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function bestTimes(tea: Tea): TimeOfDay[] {
  let max = 0;
  for (const time of TIMES) max = Math.max(max, tea.times[time] ?? 0);
  return TIMES.filter((time) => (tea.times[time] ?? 0) === max && max > 0);
}

export function tasteLabelsByWeight(tea: Tea): string[] {
  return (Object.entries(tea.tastes) as [Taste, number][])
    .filter((entry) => entry[1] > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
    .map(([taste]) => TASTE_LABEL[taste]);
}

function caffeineAdjustment(tea: Tea, prefs: Preferences, times: readonly TimeOfDay[]): number {
  if (prefs.caffeine === 'egal' || prefs.caffeine === 'nein') return 0;
  if (prefs.occasions.includes('abends')) return LOW_CAFFEINE_LIFT[tea.caffeine];
  return average(times.map((time) => CAFFEINE_BIAS[time][tea.caffeine]));
}

/** Punktzahl aus Anlass, Geschmack und abgeleiteter Tageszeit, ohne Koffein. */
export function tagScore(tea: Tea, prefs: Preferences): number {
  const normalized = normalizePreferences(prefs);
  return tagScoreNormalized(tea, normalized, timesForOccasions(normalized.occasions));
}

function tagScoreNormalized(tea: Tea, prefs: Preferences, times: readonly TimeOfDay[]): number {
  let tasteSum = 0;
  let matched = 0;
  for (const taste of prefs.tastes) {
    const weight = tea.tastes[taste] ?? 0;
    tasteSum += weight;
    if (weight > 0) matched += 1;
  }
  const tasteAvg = prefs.tastes.length ? tasteSum / prefs.tastes.length : 0;
  let occasionSum = 0;
  let occasionHits = 0;
  for (const occasion of prefs.occasions) {
    const weight = tea.occasions[occasion] ?? 0;
    occasionSum += weight;
    if (weight > 0) occasionHits += 1;
  }
  const occasionAvg = prefs.occasions.length ? occasionSum / prefs.occasions.length : 0;
  const timeScore = average(times.map((time) => tea.times[time] ?? 0));
  const missPenalty = prefs.tastes.length > 0 && matched === 0 ? 3 : 0;
  const occasionPenalty = occasionHits === 0 ? 2.5 : 0;
  return tasteAvg * TASTE_WEIGHT + occasionAvg * OCCASION_WEIGHT + timeScore - missPenalty - occasionPenalty;
}

export function scoreTea(tea: Tea, prefs: Preferences): number {
  const normalized = normalizePreferences(prefs);
  const times = timesForOccasions(normalized.occasions);
  return tagScoreNormalized(tea, normalized, times) + caffeineAdjustment(tea, normalized, times);
}

type MatchBit = { label: string; weight: number; rank: number };

function matchBits(tea: Tea, prefs: Preferences, times: readonly TimeOfDay[]): MatchBit[] {
  const bits: MatchBit[] = [];
  for (const occasion of prefs.occasions) {
    const weight = tea.occasions[occasion] ?? 0;
    if (weight > 0) bits.push({ label: OCCASION_LABEL[occasion], weight, rank: 0 });
  }
  for (const taste of prefs.tastes) {
    const weight = tea.tastes[taste] ?? 0;
    if (weight > 0) bits.push({ label: TASTE_LABEL[taste], weight, rank: 1 });
  }
  for (const time of times) {
    const weight = tea.times[time] ?? 0;
    if (weight > 0) bits.push({ label: TIME_LABEL[time], weight, rank: 2 });
  }
  bits.sort((a, b) => b.weight - a.weight || a.rank - b.rank || a.label.localeCompare(b.label, 'de'));
  return bits.slice(0, 2);
}

function buildReason(tea: Tea, prefs: Preferences, times: readonly TimeOfDay[]): string {
  const labels = matchBits(tea, prefs, times).map((bit) => bit.label);
  if (labels.length === 0) return `${tea.name} ist die nächste Entsprechung.`;
  return `${tea.name} passt zu ${joinDe(labels)}.`;
}

export function reasonForTea(tea: Tea, prefs: Preferences): string {
  const normalized = normalizePreferences(prefs);
  return buildReason(tea, normalized, timesForOccasions(normalized.occasions));
}

export function contradictionHints(prefs: Preferences): string[] {
  const normalized = normalizePreferences(prefs);
  const hints: string[] = [];
  if (normalized.caffeine === 'nein' && normalized.occasions.some((occasion) => ALERT_OCCASIONS.has(occasion))) {
    hints.push(HINT_WITHOUT_CAFFEINE);
  }
  if (normalized.caffeine === 'ja' && normalized.occasions.includes('abends')) {
    hints.push(HINT_EVENING_WITH_CAFFEINE);
  }
  return hints;
}

export function recommend(prefs: Preferences): Recommendation[] {
  const normalized = normalizePreferences(prefs);
  const times = timesForOccasions(normalized.occasions);
  const { tastes, occasions } = normalized;

  const ranked: Recommendation[] = teas
    .filter((tea) => passesCaffeine(tea, normalized.caffeine))
    .map((tea) => {
      const matchedTastes = tastes.filter((taste) => (tea.tastes[taste] ?? 0) > 0);
      const matchedOccasions = occasions.filter((occasion) => (tea.occasions[occasion] ?? 0) > 0);
      const matchedTimes = times.filter((time) => (tea.times[time] ?? 0) > 0);
      return {
        tea,
        score: tagScoreNormalized(tea, normalized, times) + caffeineAdjustment(tea, normalized, times),
        matchedTastes,
        matchedOccasions,
        matchedTimes,
        reason: buildReason(tea, normalized, times),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const byTaste = matchedWeight(b.tea, tastes) - matchedWeight(a.tea, tastes);
      if (byTaste !== 0) return byTaste;
      return a.tea.name.localeCompare(b.tea.name, 'de');
    });

  const best = ranked[0];
  if (!best) return [];

  const picks: Recommendation[] = [];
  const usedTypes = new Set<string>();
  for (const item of ranked) {
    if (picks.length >= 3) break;
    if (picks.length > 0 && item.score < best.score * DIVERSE_RATIO) break;
    if (usedTypes.has(item.tea.type)) continue;
    picks.push(item);
    usedTypes.add(item.tea.type);
  }
  return picks;
}
