import { describe, expect, it } from 'vitest';
import {
  MAX_INGREDIENTS,
  addIngredient,
  mixSum,
  mixView,
  removeIngredient,
  setPercent,
} from './mixer';
import { teas } from './recommender';

describe('Mischen', () => {
  it('hält die Summe bei 100 und lässt höchstens fünf Zutaten zu', () => {
    let items = addIngredient([], 'assam');
    expect(items).toEqual([{ id: 'assam', percent: 100 }]);
    items = addIngredient(items!, 'rooibos');
    expect(items).toEqual([
      { id: 'assam', percent: 50 },
      { id: 'rooibos', percent: 50 },
    ]);
    items = addIngredient(items!, 'kamille');
    expect(mixSum(items!)).toBe(100);
    expect(items!.every((item) => item.percent >= 33 && item.percent <= 34)).toBe(true);
    expect(items!.length).toBe(3);

    let next = items!;
    for (const id of ['sencha', 'mate']) {
      const added = addIngredient(next, id);
      expect(added, id).not.toBeNull();
      next = added!;
    }
    expect(next).toHaveLength(MAX_INGREDIENTS);
    expect(mixSum(next)).toBe(100);
    expect(addIngredient(next, 'hibiskus')).toBeNull();
    expect(addIngredient(next, 'assam')).toBeNull();
  });

  it('verteilt eine Änderung auf die übrigen Anteile', () => {
    const start = [
      { id: 'assam', percent: 34 },
      { id: 'rooibos', percent: 33 },
      { id: 'kamille', percent: 33 },
    ];
    const half = setPercent(start, 'assam', 50);
    expect(mixSum(half)).toBe(100);
    expect(half.find((item) => item.id === 'assam')?.percent).toBe(50);
    expect(half.find((item) => item.id === 'rooibos')?.percent).toBe(25);
    expect(half.find((item) => item.id === 'kamille')?.percent).toBe(25);

    const full = setPercent(half, 'assam', 100);
    expect(full.find((item) => item.id === 'assam')?.percent).toBe(100);
    expect(mixSum(full)).toBe(100);
    expect(full.filter((item) => item.id !== 'assam').every((item) => item.percent === 0)).toBe(true);

    const alone = setPercent([{ id: 'assam', percent: 100 }], 'assam', 20);
    expect(alone).toEqual([{ id: 'assam', percent: 100 }]);
  });

  it('skaliert nach dem Entfernen wieder auf 100', () => {
    const items = [
      { id: 'assam', percent: 50 },
      { id: 'rooibos', percent: 50 },
    ];
    expect(removeIngredient(items, 'assam')).toEqual([{ id: 'rooibos', percent: 100 }]);
    expect(removeIngredient(items, 'rooibos')).toEqual([{ id: 'assam', percent: 100 }]);
    expect(removeIngredient([], 'assam')).toEqual([]);
  });

  it('sortiert Zutaten, zeigt Geschmacksbalken und den Koffein-Fakt', () => {
    const peppermint = mixView([{ id: 'pfefferminze', percent: 100 }], teas);
    expect(peppermint.caffeine).toBe('Koffeinfrei');
    expect(peppermint.bars.find((bar) => bar.label === 'Frisch')?.percent).toBe(100);
    expect(peppermint.bars.find((bar) => bar.label === 'Würzig')?.percent).toBe(0);

    const apple = mixView([{ id: 'apfel-zimt', percent: 100 }], teas);
    expect(apple.bars.find((bar) => bar.label === 'Fruchtig')?.percent).toBe(100);
    expect(apple.bars.find((bar) => bar.label === 'Süßlich')?.percent).toBe(100);
    expect(apple.caffeine).toBe('Koffeinfrei');

    const blend = mixView(
      [
        { id: 'assam', percent: 50 },
        { id: 'pfefferminze', percent: 50 },
      ],
      teas,
    );
    expect(blend.lines.map((line) => line.name)).toEqual(['Assam', 'Pfefferminztee']);
    expect(blend.caffeine).toBe('Enthält Koffein');
    expect(blend.bars.find((bar) => bar.label === 'Frisch')?.percent).toBe(50);

    const empty = mixView([], teas);
    expect(empty.caffeine).toBeNull();
    expect(empty.bars.every((bar) => bar.percent === 0)).toBe(true);
  });
});
