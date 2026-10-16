import { teas } from './recommender';
import type { Tea } from './types';

export type CollectionTea = {
  id: string;
  reason: string;
};

export type Collection = {
  id: string;
  title: string;
  /** Sichtbarer Hinweis, z. B. bei der Karte für Schwangere. */
  note?: string;
  intro?: string;
  teas: readonly CollectionTea[];
};

/**
 * Feste Karten, unabhängig von der Auswahl.
 * Für Schwangere nur Sorten, die üblicherweise als einfache, koffeinfreie
 * Tasse ohne umstrittene Kräuter genannt werden. Im Zweifel weglassen.
 */
export const COLLECTIONS: readonly Collection[] = [
  {
    id: 'arbeit',
    title: 'Für die Arbeit',
    teas: [
      { id: 'darjeeling', reason: 'Heller Schwarztee mit blumiger Art, eine übliche Tasse am Schreibtisch.' },
      { id: 'sencha', reason: 'Grasig-herber Grüntee, kurz gezogen.' },
      { id: 'assam', reason: 'Malziger, voller Schwarztee für eine Tasse am Morgen.' },
      { id: 'earl-grey', reason: 'Schwarztee mit zitroniger Bergamotte.' },
    ],
  },
  {
    id: 'sport',
    title: 'Für Sportler',
    teas: [
      { id: 'pfefferminze', reason: 'Klar minzig und ohne Koffein, heiß oder kalt.' },
      { id: 'zitronenverbene', reason: 'Zitronig-fruchtig und ohne Koffein.' },
      { id: 'rooibos', reason: 'Milder Rotbusch, von sich aus ohne Koffein.' },
      { id: 'hagebutte', reason: 'Säuerlich-fruchtiger Aufguss ohne Koffein.' },
    ],
  },
  {
    id: 'abend',
    title: 'Für den Abend',
    teas: [
      { id: 'kamille', reason: 'Blumig und ohne Koffein, eine übliche Tasse am Abend.' },
      { id: 'lavendel', reason: 'Floraler Aufguss aus Blüten, ohne Koffein.' },
      { id: 'rooibos', reason: 'Mild und holzig-süß, ohne Koffein.' },
      { id: 'fenchel', reason: 'Mild-süßlich aus Fenchelsamen, ohne Koffein.' },
    ],
  },
  {
    id: 'koffeinfrei',
    title: 'Koffeinfrei',
    teas: [
      { id: 'rooibos', reason: 'Rotbusch ohne Koffein, mild und holzig-süß.' },
      { id: 'kamille', reason: 'Blumiger Kräutertee, von sich aus ohne Koffein.' },
      { id: 'pfefferminze', reason: 'Minziger Aufguss ohne Koffein.' },
      { id: 'hagebutte', reason: 'Fruchtiger Aufguss aus Hagebuttenschalen, ohne Koffein.' },
    ],
  },
  {
    id: 'einsteiger',
    title: 'Für Einsteiger',
    teas: [
      { id: 'rooibos', reason: 'Mild und wenig bitter, einfach mit kochendem Wasser.' },
      { id: 'apfel-zimt', reason: 'Apfel und Zimt, süßlich ohne Zucker.' },
      { id: 'jasmin', reason: 'Blumig und eher mild im Aufguss.' },
      { id: 'kamille', reason: 'Bekannter Blütenaufguss, unkompliziert zu ziehen.' },
    ],
  },
  {
    id: 'schwanger',
    title: 'Für Schwangere',
    intro: 'Hier stehen Rooibos und reiner Hagebuttentee: koffeinfrei, ohne Kräuter.',
    note: 'Bitte im Zweifel mit Hebamme/Ärztin absprechen.',
    teas: [
      { id: 'rooibos', reason: 'Koffeinfreier Rotbusch ohne Kräuter, oft als einfache Tasse genannt.' },
      { id: 'hagebutte', reason: 'Aufguss nur aus Hagebuttenschalen, ohne Kräuter und ohne Koffein.' },
    ],
  },
];

const byId = new Map(teas.map((tea) => [tea.id, tea]));

export function teasForCollection(collection: Collection): { tea: Tea; reason: string }[] {
  return collection.teas.map((entry) => {
    const tea = byId.get(entry.id);
    if (!tea) throw new Error(`Sammlung ${collection.id}: Tee fehlt (${entry.id}).`);
    return { tea, reason: entry.reason };
  });
}
