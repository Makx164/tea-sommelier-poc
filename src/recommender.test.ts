import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { recommend, scoreTea, teas } from './recommender';
import {
  CAFFEINE_CHOICES,
  MOODS,
  TASTES,
  TIMES,
  type CaffeineChoice,
  type Mood,
  type Taste,
  type TimeOfDay,
} from './types';

const EFFECT_CLAIMS = [
  /hilft bei/i,
  /belebend/i,
  /heilung/i,
  /\bheilt\b/i,
  /heilmittel/i,
  /wirkung/i,
  /\bwirkt\b/i,
  /symptom/i,
  /stress/i,
  /\bimmun/i,
  /kopfschmerz/i,
  /entspannend/i,
  /wohltu/i,
  /magen/i,
  /erkält/i,
  /fokussierung/i,
  /konzentration/i,
  /beschwerd/i,
  /medizin/i,
  /krankheit/i,
  /detox/i,
  /anregend/i,
  /einschlaf/i,
  /\barzt/i,
  /warenkorb/i,
  /bestell/i,
  /macht wach/i,
  /macht schlafen/i,
  /fördert/i,
  /foerdert/i,
];

/** Richtungsnamen sind erlaubt. Heil- und Wirkversprechen bleiben verboten. */
function withoutDirectionLabels(text: string): string {
  return text
    .replaceAll('Fokus', '')
    .replaceAll('Verdauung', '')
    .replaceAll('Beruhigung', '')
    .replaceAll('Schlaf', '');
}

function expectNoEffectClaim(text: string, label: string): void {
  for (const pattern of EFFECT_CLAIMS) {
    expect(text, `${label} ${pattern}`).not.toMatch(pattern);
  }
  const rest = withoutDirectionLabels(text);
  expect(rest, label).not.toMatch(/beruhig/i);
  expect(rest, label).not.toMatch(/schlaf/i);
  expect(rest, label).not.toMatch(/verdau/i);
  expect(rest, label).not.toMatch(/fokus/i);
  expect(rest, label).not.toMatch(/entspann/i);
}

const base = { mood: 'beruhigung' as Mood, caffeine: 'egal' as CaffeineChoice };

describe('Datensatz', () => {
  it('enthält 20 bis 30 Tees mit eindeutigen Ids', () => {
    expect(teas.length).toBeGreaterThanOrEqual(20);
    expect(teas.length).toBeLessThanOrEqual(30);
    expect(new Set(teas.map((tea) => tea.id)).size).toBe(teas.length);
  });

  it('nutzt nur die vier Geschmäcker und mindestens eine Richtung', () => {
    for (const tea of teas) {
      const tasteKeys = Object.keys(tea.tastes);
      expect(tasteKeys.length, tea.id).toBeGreaterThan(0);
      for (const key of tasteKeys) expect(TASTES, tea.id).toContain(key);
      expect(tea.tastes).not.toHaveProperty('erdig');
      expect(tea.tastes).not.toHaveProperty('mild');
      expect(Object.keys(tea.moods).length, tea.id).toBeGreaterThan(0);
      for (const key of Object.keys(tea.moods)) expect(MOODS, tea.id).toContain(key);
    }
    for (const mood of MOODS) {
      expect(teas.some((tea) => (tea.moods[mood] ?? 0) > 0), mood).toBe(true);
    }
  });

  it('beschreibt Geschmack und Zubereitung ohne Wirkversprechen', () => {
    for (const tea of teas) {
      const prose = [tea.summary, tea.brewNote, tea.caffeineDetail, tea.name, tea.origin, tea.type]
        .filter(Boolean)
        .join(' ');
      expectNoEffectClaim(prose, tea.id);
    }
  });
});

describe('recommend', () => {
  it('liefert je Auswahl 1 bis 3 Tees in absteigender Punktzahl', () => {
    for (const time of TIMES) {
      for (const taste of TASTES) {
        for (const mood of MOODS) {
          for (const caffeine of CAFFEINE_CHOICES) {
            const result = recommend({ tastes: [taste], times: [time], mood, caffeine });
            expect(result.length, `${taste} ${time} ${mood} ${caffeine}`).toBeGreaterThanOrEqual(1);
            expect(result.length).toBeLessThanOrEqual(3);
            for (let i = 1; i < result.length; i += 1) {
              expect(result[i]!.score).toBeLessThanOrEqual(result[i - 1]!.score);
            }
            expect(new Set(result.map((item) => item.tea.type)).size).toBe(result.length);
          }
        }
      }
    }
  });

  it('begründet mit Geschmack, Tageszeit und der Richtung ohne Heilaussage', () => {
    const result = recommend({ tastes: ['blumig'], times: ['abend'], mood: 'schlaf', caffeine: 'egal' });
    expect(result[0]?.reason).toMatch(/passt zum Abend\. Häufig mit dieser Richtung verbunden: Schlaf/);
    expect(result[0]?.reason).not.toMatch(/hilft bei|heilt|fördert die Verdauung|macht schlafen/i);
    expect(result[0]?.matchedTastes).toContain('blumig');
    expect(result[0]?.matchedMood).toBe(true);
  });

  it('schlägt am Morgen bei kräftig und Fokus Matcha, Mate und Assam vor', () => {
    const result = recommend({ tastes: ['kraeftig'], times: ['morgen'], mood: 'fokus', caffeine: 'egal' });
    expect(result.map((item) => item.tea.id)).toEqual(['matcha', 'mate', 'assam']);
    expect(result.every((item) => item.tea.caffeine === 'hoch')).toBe(true);
  });

  it('schlägt am Abend bei blumig und Schlaf koffeinarme Tees vor', () => {
    const result = recommend({ tastes: ['blumig'], times: ['abend'], mood: 'schlaf', caffeine: 'egal' });
    expect(result[0]?.tea.id).toBe('kamille');
    expect(result[0]?.tea.caffeine).toBe('kein');
    expect(result.every((item) => item.tea.caffeine !== 'hoch')).toBe(true);
  });

  it('bleibt am Abend bei kräftig und Beruhigung ohne hohen Koffeingehalt', () => {
    const result = recommend({ tastes: ['kraeftig'], times: ['abend'], mood: 'beruhigung', caffeine: 'egal' });
    expect(result.map((item) => item.tea.id)).toEqual(['rooibos', 'hojicha', 'pfefferminze']);
    expect(result.every((item) => item.tea.caffeine !== 'hoch')).toBe(true);
  });

  it('ordnet fruchtig am Nachmittag bei Beruhigung Apfel-Zimt vorn', () => {
    const result = recommend({ tastes: ['fruchtig'], times: ['nachmittag'], mood: 'beruhigung', caffeine: 'egal' });
    expect(result[0]?.tea.id).toBe('apfel-zimt');
    expect(new Set(result.map((item) => item.tea.type)).size).toBe(result.length);
  });

  it('ändert die Reihenfolge, wenn nur die Richtung wechselt', () => {
    const shared = { tastes: ['fruchtig'] as Taste[], times: ['nachmittag'] as TimeOfDay[], caffeine: 'egal' as CaffeineChoice };
    const calm = recommend({ ...shared, mood: 'beruhigung' });
    const focus = recommend({ ...shared, mood: 'fokus' });
    expect(calm[0]?.tea.id).toBe('apfel-zimt');
    expect(focus[0]?.tea.id).toBe('darjeeling');
    expect(calm[0]?.matchedMood).toBe(true);
    expect(focus[0]?.matchedMood).toBe(true);
  });

  it('filtert bei Nein auf koffeinfreie Tees und bei Ja auf Tees mit Koffein', () => {
    const prefs = { tastes: ['kraeftig'] as Taste[], times: ['abend'] as TimeOfDay[], mood: 'beruhigung' as Mood };
    const without = recommend({ ...prefs, caffeine: 'nein' });
    const withCaffeine = recommend({ ...prefs, caffeine: 'ja' });
    const either = recommend({ ...prefs, caffeine: 'egal' });
    expect(without.length).toBeGreaterThan(0);
    expect(without.every((item) => item.tea.caffeine === 'kein')).toBe(true);
    expect(withCaffeine.length).toBeGreaterThan(0);
    expect(withCaffeine.every((item) => item.tea.caffeine !== 'kein')).toBe(true);
    expect(either.some((item) => item.tea.caffeine === 'kein')).toBe(true);
    expect(either.some((item) => item.tea.caffeine !== 'kein')).toBe(true);
  });

  it('lehnt leere oder unbekannte Auswahl ab', () => {
    expect(() => recommend({ tastes: [], times: ['morgen'], ...base })).toThrow(/Geschmack/);
    expect(() => recommend({ tastes: ['herb'], times: ['nacht' as TimeOfDay], ...base })).toThrow(/Tageszeit/);
    expect(() => recommend({ tastes: ['herb'], times: [], ...base })).toThrow(/Tageszeit/);
    expect(() => recommend({ tastes: ['suess' as Taste], times: ['mittag'], ...base })).toThrow(/Geschmack/);
    expect(() => recommend({ tastes: ['herb'], times: ['mittag'], mood: 'muede' as Mood, caffeine: 'egal' })).toThrow(/Richtung/);
    expect(() =>
      recommend({ tastes: ['herb'], times: ['mittag'], mood: 'fokus', caffeine: 'manchmal' as CaffeineChoice }),
    ).toThrow(/Koffein/);
  });

  it('empfiehlt ohne Richtung nach Geschmack, Tageszeit und Koffein', () => {
    const morning = recommend({ tastes: ['kraeftig'], times: ['morgen'], mood: null, caffeine: 'egal' });
    expect(morning.map((item) => item.tea.id)).toEqual(['assam', 'matcha', 'mate']);
    expect(morning.every((item) => item.matchedMood)).toBe(false);
    expect(morning.every((item) => item.tea.caffeine === 'hoch')).toBe(true);

    const evening = recommend({ tastes: ['blumig'], times: ['abend'], mood: null, caffeine: 'egal' });
    expect(evening[0]?.tea.id).toBe('kamille');
    expect(evening[0]?.reason).toMatch(/passt zum Abend\./);
    expect(evening[0]?.reason).not.toMatch(/Häufig mit dieser Richtung verbunden/);
    expect(evening.every((item) => item.tea.caffeine !== 'hoch')).toBe(true);
  });

  it('mittelt mehrere Tageszeiten und zählt jede nur einmal', () => {
    const once = recommend({ tastes: ['blumig'], times: ['abend'], mood: 'schlaf', caffeine: 'egal' });
    const twice = recommend({ tastes: ['blumig'], times: ['abend', 'abend'], mood: 'schlaf', caffeine: 'egal' });
    expect(twice.map((item) => ({ id: item.tea.id, score: item.score }))).toEqual(
      once.map((item) => ({ id: item.tea.id, score: item.score })),
    );

    const matcha = teas.find((tea) => tea.id === 'matcha');
    const rooibos = teas.find((tea) => tea.id === 'rooibos');
    expect(matcha).toBeDefined();
    expect(rooibos).toBeDefined();
    const morning = { tastes: ['kraeftig'] as Taste[], times: ['morgen'] as TimeOfDay[], mood: null, caffeine: 'egal' as CaffeineChoice };
    const both = { ...morning, times: ['morgen', 'abend'] as TimeOfDay[] };
    expect(scoreTea(matcha!, both)).toBeLessThan(scoreTea(matcha!, morning));
    expect(scoreTea(rooibos!, both)).toBeGreaterThan(scoreTea(rooibos!, morning));

    const mixed = recommend(both);
    expect(mixed.length).toBeGreaterThanOrEqual(1);
    expect(mixed.length).toBeLessThanOrEqual(3);
    expect(mixed[0]?.reason).toMatch(/zum Morgen und zum Abend/);
    expect(mixed.every((item) => item.matchedMood)).toBe(false);
    expect(mixed.map((item) => item.tea.id)).not.toEqual(['assam', 'matcha', 'mate']);
  });

  it('hält Gründe frei von Wirkversprechen', () => {
    for (const time of TIMES) {
      for (const taste of TASTES) {
        for (const mood of MOODS) {
          for (const item of recommend({ tastes: [taste], times: [time], mood, caffeine: 'egal' })) {
            expectNoEffectClaim(item.reason, item.tea.id);
            if (item.matchedMood) {
              expect(item.reason).toMatch(/Häufig mit dieser Richtung verbunden/);
            } else {
              expect(item.reason).not.toMatch(/Häufig mit dieser Richtung verbunden/);
            }
          }
        }
      }
    }
  });
});

describe('Öffentliche Texte', () => {
  it('übernehmen keine Symptom-, Wirk- oder Shop-Sprache aus dem Clickdummy', () => {
    const files = [
      'index.html',
      'impressum.html',
      'datenschutz.html',
      'src/main.ts',
      'src/style.css',
      'README.md',
      'CHANGELOG.md',
    ];
    const forbidden = [
      'Schlafproblem',
      'Erkältung',
      'Kopfschmerz',
      'Immunsystem',
      'Warenkorb',
      'beruhigend',
      'beruhigt',
      'belebend',
      'Völlegefühl',
      'Magenproblem',
      'n8n',
      'macht wach',
      'macht schlafen',
      'fördert',
      'hilft bei',
      'heilt',
    ];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const word of forbidden) {
        expect(text, `${file} enthält ${word}`).not.toContain(word);
      }
    }
  });

  it('beschreibt die Richtung als Geschmacksorientierung', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('Wofür suchst du Tee?');
    expect(html).toContain('Optional. Nochmal wählen hebt die Auswahl auf.');
    expect(html).toContain('Eine oder mehrere Tageszeiten.');
    expect(html).toContain('type="checkbox" data-group="time"');
    expect(html).not.toContain('name="time"');
    expect(html).toContain('häufig mit dieser Richtung verbunden');
    expect(html).toContain('Geschmacksorientierung, keine Gesundheitsaussage');
    expect(html).toContain('🎯');
    expect(html).toContain('🌿');
    expect(html).toContain('😌');
    expect(html).toContain('🌙');
  });
});
