import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { recommend, teas } from './recommender';
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
  /beruhig/i,
  /belebend/i,
  /heilung/i,
  /\bheilt\b/i,
  /heilmittel/i,
  /wirkung/i,
  /\bwirkt\b/i,
  /symptom/i,
  /stress/i,
  /schlaf/i,
  /verdau/i,
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
  /fördert/i,
  /foerdert/i,
];

/** Stimmungsnamen sind Gelegenheiten. Der Rest der Texte bleibt frei von Wirkversprechen. */
function withoutOccasionLabels(text: string): string {
  return text
    .replaceAll('Entspannt', '')
    .replaceAll('Fokussiert', '')
    .replaceAll('Gemütlich', '')
    .replaceAll('Wach', '');
}

function expectNoEffectClaim(text: string, label: string): void {
  for (const pattern of EFFECT_CLAIMS) {
    expect(text, `${label} ${pattern}`).not.toMatch(pattern);
  }
  const rest = withoutOccasionLabels(text);
  expect(rest, label).not.toMatch(/entspann/i);
  expect(rest, label).not.toMatch(/fokus/i);
}

const base = { mood: 'gemuetlich' as Mood, caffeine: 'egal' as CaffeineChoice };

describe('Datensatz', () => {
  it('enthält 20 bis 30 Tees mit eindeutigen Ids', () => {
    expect(teas.length).toBeGreaterThanOrEqual(20);
    expect(teas.length).toBeLessThanOrEqual(30);
    expect(new Set(teas.map((tea) => tea.id)).size).toBe(teas.length);
  });

  it('nutzt nur die vier Geschmäcker und mindestens eine Stimmung', () => {
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
            const result = recommend({ tastes: [taste], time, mood, caffeine });
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

  it('begründet mit Geschmack, Tageszeit und passender Stimmung', () => {
    const result = recommend({ tastes: ['blumig'], time: 'abend', mood: 'entspannt', caffeine: 'egal' });
    expect(result[0]?.reason).toMatch(/passt zum Abend, zur Stimmung Entspannt/);
    expect(result[0]?.matchedTastes).toContain('blumig');
    expect(result[0]?.matchedMood).toBe(true);
  });

  it('schlägt am Morgen bei kräftig und Wach Assam, Matcha und Mate vor', () => {
    const result = recommend({ tastes: ['kraeftig'], time: 'morgen', mood: 'wach', caffeine: 'egal' });
    expect(result.map((item) => item.tea.id)).toEqual(['assam', 'matcha', 'mate']);
    expect(result.every((item) => item.tea.caffeine === 'hoch')).toBe(true);
  });

  it('schlägt am Abend bei blumig und Entspannt koffeinarme Tees vor', () => {
    const result = recommend({ tastes: ['blumig'], time: 'abend', mood: 'entspannt', caffeine: 'egal' });
    expect(result.map((item) => item.tea.id)).toEqual(['kamille', 'silver-needle']);
    expect(result[0]?.tea.caffeine).toBe('kein');
    expect(result.every((item) => item.tea.caffeine === 'kein' || item.tea.caffeine === 'niedrig' || item.tea.caffeine === 'mittel')).toBe(true);
  });

  it('bleibt am Abend bei kräftig und Gemütlich ohne hohen Koffeingehalt', () => {
    const result = recommend({ tastes: ['kraeftig'], time: 'abend', mood: 'gemuetlich', caffeine: 'egal' });
    expect(result.map((item) => item.tea.id)).toEqual(['rooibos', 'hojicha', 'da-hong-pao']);
    expect(result.every((item) => item.tea.caffeine !== 'hoch')).toBe(true);
  });

  it('mischt bei fruchtig am Nachmittag und Gemütlich Frucht und weitere Arten', () => {
    const result = recommend({ tastes: ['fruchtig'], time: 'nachmittag', mood: 'gemuetlich', caffeine: 'egal' });
    expect(result[0]?.tea.id).toBe('apfel-zimt');
    expect(new Set(result.map((item) => item.tea.type)).size).toBe(result.length);
  });

  it('ändert die Reihenfolge, wenn nur die Stimmung wechselt', () => {
    const shared = { tastes: ['fruchtig'] as Taste[], time: 'nachmittag' as TimeOfDay, caffeine: 'egal' as CaffeineChoice };
    const cozy = recommend({ ...shared, mood: 'gemuetlich' });
    const awake = recommend({ ...shared, mood: 'wach' });
    expect(cozy.map((item) => item.tea.id)).toEqual(['apfel-zimt', 'darjeeling']);
    expect(awake.map((item) => item.tea.id)).toEqual(['hagebutte', 'zitronenverbene', 'ceylon']);
    expect(cozy[0]?.matchedMood).toBe(true);
    expect(awake[0]?.matchedMood).toBe(true);
  });

  it('filtert bei Nein auf koffeinfreie Tees und bei Ja auf Tees mit Koffein', () => {
    const prefs = { tastes: ['kraeftig'] as Taste[], time: 'abend' as TimeOfDay, mood: 'gemuetlich' as Mood };
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
    expect(() => recommend({ tastes: [], time: 'morgen', ...base })).toThrow(/Geschmack/);
    expect(() => recommend({ tastes: ['herb'], time: 'nacht' as TimeOfDay, ...base })).toThrow(/Tageszeit/);
    expect(() => recommend({ tastes: ['suess' as Taste], time: 'mittag', ...base })).toThrow(/Geschmack/);
    expect(() => recommend({ tastes: ['herb'], time: 'mittag', mood: 'muede' as Mood, caffeine: 'egal' })).toThrow(/Stimmung/);
    expect(() =>
      recommend({ tastes: ['herb'], time: 'mittag', mood: 'wach', caffeine: 'manchmal' as CaffeineChoice }),
    ).toThrow(/Koffein/);
  });

  it('hält Gründe frei von Wirkversprechen', () => {
    for (const time of TIMES) {
      for (const taste of TASTES) {
        for (const mood of MOODS) {
          for (const item of recommend({ tastes: [taste], time, mood, caffeine: 'egal' })) {
            expectNoEffectClaim(item.reason, item.tea.id);
            if (item.matchedMood) {
              expect(item.reason).toMatch(/zur Stimmung/);
            } else {
              expect(item.reason).not.toMatch(/zur Stimmung/);
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
      'Verdauung',
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
      'fördert',
    ];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const word of forbidden) {
        expect(text, `${file} enthält ${word}`).not.toContain(word);
      }
    }
  });
});
