import { teas } from './recommender';
import type { Occasion, Tea } from './types';

export type DiscoverList = {
  id: string;
  title: string;
  occasion: Occasion;
};

/**
 * Listen nach Anlass. Ein Tee steht drin, wenn das übernommene Moment-Gewicht
 * mindestens 2 ist. Sortierung nach diesem Gewicht, dann nach Namen.
 */
export const DISCOVER_LISTS: readonly DiscoverList[] = [
  { id: 'fokus', title: 'Für den fokussierten Start', occasion: 'fokus' },
  { id: 'feierabend', title: 'Für den Feierabend', occasion: 'abend' },
  { id: 'nach-essen', title: 'Nach dem Essen', occasion: 'nach_essen' },
  { id: 'kalte-tage', title: 'Für kalte Tage', occasion: 'aufwaermen' },
  { id: 'training', title: 'Beliebt nach dem Training', occasion: 'erfrischen' },
  { id: 'suesses', title: 'Etwas Süßes', occasion: 'suesses' },
];

export const MIN_LIST_WEIGHT = 2;

export function teasForList(list: DiscoverList): { tea: Tea; weight: number }[] {
  return teas
    .map((tea) => ({ tea, weight: tea.occasions[list.occasion] ?? 0 }))
    .filter((entry) => entry.weight >= MIN_LIST_WEIGHT)
    .sort((a, b) => b.weight - a.weight || a.tea.name.localeCompare(b.tea.name, 'de'));
}
