import rawTeas from './data/teas.json';
import {
  CAFFEINE_CHOICES,
  CAFFEINE_LEVELS,
  DIRECTION_PHRASE,
  MOODS,
  MOOD_LABEL,
  OCCASIONS,
  OCCASION_LABEL,
  TASTES,
  TASTE_LABEL,
  TIMES,
  TIME_LABEL,
  joinDe,
  type Caffeine,
  type CaffeineChoice,
  type Mood,
  type Occasion,
  type Preferences,
  type Recommendation,
  type Taste,
  type Tea,
  type TimeOfDay,
} from './types';

const TASTE_WEIGHT = 2.4;
const OCCASION_WEIGHT = 2.2;
const MOOD_WEIGHT = 1.6;
const DIVERSE_RATIO = 0.6;

/**
 * Tageszeit verschiebt nur den Koffeingehalt als Getränkeeigenschaft:
 * Abend bevorzugt koffeinfrei, Morgen etwas mehr Koffein.
 * Mehrere Tageszeiten werden gemittelt, damit die Verschiebung nicht stapelt.
 * Eine gesetzte Koffein-Auswahl filtert vorher, die Verschiebung bleibt im Rest.
 * Ohne Richtung entfällt dieser Anteil; Anlass, Geschmack, Tageszeit und Koffein bleiben.
 */
const CAFFEINE_BIAS: Record<TimeOfDay, Record<Caffeine, number>> = {
  morgen: { hoch: 1.6, mittel: 0.9, niedrig: 0.1, kein: -0.3 },
  mittag: { hoch: 0.3, mittel: 0.6, niedrig: 0.4, kein: 0.3 },
  nachmittag: { hoch: -0.5, mittel: 0.6, niedrig: 0.9, kein: 0.6 },
  abend: { hoch: -3.4, mittel: -2.2, niedrig: 0.4, kein: 2.3 },
};

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
  const moods = parseWeights(raw.moods, MOODS, `${id} Richtung`);
  if (Object.keys(tastes).length === 0) throw new Error(`${id}: kein Geschmack.`);
  if (Object.keys(times).length === 0) throw new Error(`${id}: keine Tageszeit.`);
  if (Object.keys(occasions).length === 0) throw new Error(`${id}: kein Anlass.`);
  if (Object.keys(moods).length === 0) throw new Error(`${id}: keine Richtung.`);
  const tea: Tea = {
    id,
    name: asText(raw.name, `${id} Name`),
    type: asText(raw.type, `${id} Art`),
    origin: asText(raw.origin, `${id} Herkunft`),
    summary: asText(raw.summary, `${id} Beschreibung`),
    tastes,
    times,
    occasions,
    moods,
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

export function scoreTea(tea: Tea, prefs: Preferences): number {
  const tastes = uniqueValues(prefs.tastes, TASTES);
  const times = uniqueValues(prefs.times, TIMES);
  const occasions = uniqueValues(prefs.occasions, OCCASIONS);
  let tasteSum = 0;
  let matched = 0;
  for (const taste of tastes) {
    const weight = tea.tastes[taste] ?? 0;
    tasteSum += weight;
    if (weight > 0) matched += 1;
  }
  const tasteAvg = tastes.length ? tasteSum / tastes.length : 0;
  let occasionSum = 0;
  let occasionHits = 0;
  for (const occasion of occasions) {
    const weight = tea.occasions[occasion] ?? 0;
    occasionSum += weight;
    if (weight > 0) occasionHits += 1;
  }
  const occasionAvg = occasions.length ? occasionSum / occasions.length : 0;
  const timeScore = average(times.map((time) => tea.times[time] ?? 0));
  const caffeineScore = average(times.map((time) => CAFFEINE_BIAS[time][tea.caffeine]));
  const moodScore = prefs.mood ? (tea.moods[prefs.mood] ?? 0) * MOOD_WEIGHT : 0;
  const missPenalty = matched === 0 ? 3 : 0;
  const occasionPenalty = occasionHits === 0 ? 2.5 : 0;
  return (
    tasteAvg * TASTE_WEIGHT +
    occasionAvg * OCCASION_WEIGHT +
    timeScore +
    caffeineScore +
    moodScore -
    missPenalty -
    occasionPenalty
  );
}

function timePhrase(times: readonly TimeOfDay[]): string {
  return joinDe(times.map((time) => `zum ${TIME_LABEL[time]}`));
}

function buildReason(tea: Tea, prefs: Preferences, matched: readonly Taste[], matchedOccasions: readonly Occasion[]): string {
  const occasionLabels = prefs.occasions.map((occasion) => OCCASION_LABEL[occasion]);
  const tasteLabels = prefs.tastes.map((taste) => TASTE_LABEL[taste]);
  const when = timePhrase(prefs.times);
  const moodFit = prefs.mood !== null && (tea.moods[prefs.mood] ?? 0) > 0;
  const tradition = matchedOccasions.length
    ? `, wird traditionell getrunken zu ${joinDe(matchedOccasions.map((occasion) => OCCASION_LABEL[occasion]))}`
    : '';
  const moodBit = moodFit && prefs.mood ? `, ${DIRECTION_PHRASE}: ${MOOD_LABEL[prefs.mood]}` : '';
  const verb = matched.length ? 'passt zu' : 'ist die nächste Entsprechung für';
  const lead = `${tea.name} ${verb} ${joinDe(occasionLabels)}, ${joinDe(tasteLabels)} und ${when}${tradition}${moodBit}.`;
  return `${lead} ${tea.summary}`;
}

function moodWeight(tea: Tea, mood: Mood | null): number {
  return mood ? (tea.moods[mood] ?? 0) : 0;
}

export function recommend(prefs: Preferences): Recommendation[] {
  const tastes = uniqueValues(prefs.tastes, TASTES);
  const times = uniqueValues(prefs.times ?? [], TIMES);
  const occasions = uniqueValues(prefs.occasions ?? [], OCCASIONS);
  if (!Array.isArray(prefs.occasions) || occasions.length === 0) {
    throw new Error('Mindestens ein Anlass ist nötig.');
  }
  if (tastes.length === 0) {
    throw new Error('Mindestens ein Geschmack ist nötig.');
  }
  if (!Array.isArray(prefs.times) || times.length === 0) {
    throw new Error('Mindestens eine Tageszeit ist nötig.');
  }
  if (prefs.mood !== null && !MOODS.includes(prefs.mood)) {
    throw new Error('Unbekannte Richtung.');
  }
  if (!CAFFEINE_CHOICES.includes(prefs.caffeine)) {
    throw new Error('Unbekannte Koffein-Auswahl.');
  }
  const normalized: Preferences = {
    occasions,
    tastes,
    times,
    mood: prefs.mood,
    caffeine: prefs.caffeine,
  };

  const ranked: Recommendation[] = teas
    .filter((tea) => passesCaffeine(tea, normalized.caffeine))
    .map((tea) => {
      const matchedTastes = tastes.filter((taste) => (tea.tastes[taste] ?? 0) > 0);
      const matchedOccasions = occasions.filter((occasion) => (tea.occasions[occasion] ?? 0) > 0);
      const matchedMood = normalized.mood !== null && (tea.moods[normalized.mood] ?? 0) > 0;
      return {
        tea,
        score: scoreTea(tea, normalized),
        matchedTastes,
        matchedOccasions,
        matchedMood,
        reason: buildReason(tea, normalized, matchedTastes, matchedOccasions),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const byTaste = matchedWeight(b.tea, tastes) - matchedWeight(a.tea, tastes);
      if (byTaste !== 0) return byTaste;
      const byMood = moodWeight(b.tea, normalized.mood) - moodWeight(a.tea, normalized.mood);
      if (byMood !== 0) return byMood;
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
