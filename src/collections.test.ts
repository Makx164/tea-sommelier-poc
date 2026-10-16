import { describe, expect, it } from 'vitest';
import { COLLECTIONS, teasForCollection } from './collections';
import { CAFFEINE_LEVELS } from './types';

const EFFECT_CLAIMS = [
  /hilft bei/i,
  /belebend/i,
  /heilung/i,
  /\bheilt\b/i,
  /heilmittel/i,
  /wirkung/i,
  /\bwirkt\b/i,
  /symptom/i,
  /erkält/i,
  /schnupfen/i,
  /medizin/i,
  /krankheit/i,
  /fördert/i,
  /unbedenklich/i,
  /sicher für/i,
  /wehen/i,
];

describe('Beliebte Tees', () => {
  it('nennt die sechs festen Karten ohne Quiz', () => {
    expect(COLLECTIONS.map((collection) => collection.title)).toEqual([
      'Für die Arbeit',
      'Für Sportler',
      'Für den Abend',
      'Koffeinfrei',
      'Für Einsteiger',
      'Für Schwangere',
    ]);
  });

  it('zeigt je Karte drei oder vier Tees, außer bei Schwangeren', () => {
    for (const collection of COLLECTIONS) {
      const entries = teasForCollection(collection);
      if (collection.id === 'schwanger') {
        expect(entries.length).toBe(2);
      } else {
        expect(entries.length).toBeGreaterThanOrEqual(3);
        expect(entries.length).toBeLessThanOrEqual(4);
      }
      for (const entry of entries) {
        expect(entry.reason.trim().length).toBeGreaterThan(10);
        expect(entry.tea.caffeine).toBeTypeOf('string');
        expect(CAFFEINE_LEVELS).toContain(entry.tea.caffeine);
        for (const pattern of EFFECT_CLAIMS) {
          expect(`${collection.title} ${entry.reason}`, String(pattern)).not.toMatch(pattern);
        }
      }
    }
  });

  it('hält Koffein, Abend und Sport bei koffeinfreien Tees', () => {
    for (const id of ['koffeinfrei', 'abend', 'sport', 'schwanger']) {
      const collection = COLLECTIONS.find((item) => item.id === id);
      expect(collection, id).toBeDefined();
      expect(teasForCollection(collection!).every((entry) => entry.tea.caffeine === 'kein')).toBe(true);
    }
  });

  it('nennt für Schwangere nur Rooibos und Hagebutte und den Hinweis zur Hebamme', () => {
    const card = COLLECTIONS.find((collection) => collection.id === 'schwanger');
    expect(card).toBeDefined();
    expect(card!.teas.map((tea) => tea.id)).toEqual(['rooibos', 'hagebutte']);
    expect(card!.intro).toBe('Hier stehen Rooibos und reiner Hagebuttentee: koffeinfrei, ohne Kräuter.');
    expect(card!.note).toBe('Bitte im Zweifel mit Hebamme/Ärztin absprechen.');
    const excluded = [
      'kamille',
      'pfefferminze',
      'fenchel',
      'hibiskus',
      'lavendel',
      'mate',
      'matcha',
      'assam',
      'apfel-zimt',
      'zitronenverbene',
      'sencha',
      'earl-grey',
      'jasmin',
    ];
    for (const id of excluded) {
      expect(card!.teas.map((tea) => tea.id)).not.toContain(id);
    }
    const prose = [card!.title, card!.intro, card!.note, ...card!.teas.map((tea) => tea.reason)].join(' ');
    for (const pattern of EFFECT_CLAIMS) {
      expect(prose, String(pattern)).not.toMatch(pattern);
    }
  });
});
