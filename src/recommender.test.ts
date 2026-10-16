import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { recommend, scoreTea, teas } from './recommender';
import {
  CAFFEINE_CHOICES,
  MOODS,
  MOOD_LABEL,
  OCCASIONS,
  OCCASION_LABEL,
  TASTES,
  TASTE_LABEL,
  TIMES,
  type CaffeineChoice,
  type Mood,
  type Occasion,
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
  /\barzt\b/i,
  /warenkorb/i,
  /bestell/i,
  /macht wach/i,
  /macht schlafen/i,
  /fördert/i,
  /foerdert/i,
];

/** Richtungs-, Anlass- und Geschmacksbezeichnungen sind erlaubt. Heilversprechen bleiben verboten. */
function withoutDirectionLabels(text: string): string {
  let rest = text;
  for (const label of [...Object.values(MOOD_LABEL), ...Object.values(OCCASION_LABEL), ...Object.values(TASTE_LABEL)]) {
    rest = rest.replaceAll(label, '');
  }
  return rest;
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

const base = {
  occasions: ['abends'] as Occasion[],
  mood: 'beruhigung' as Mood,
  caffeine: 'egal' as CaffeineChoice,
};

describe('Datensatz', () => {
  it('enthält 20 bis 30 Tees mit eindeutigen Ids', () => {
    expect(teas.length).toBeGreaterThanOrEqual(20);
    expect(teas.length).toBeLessThanOrEqual(30);
    expect(new Set(teas.map((tea) => tea.id)).size).toBe(teas.length);
  });

  it('nutzt die acht Geschmäcker, jeden Anlass und mindestens eine Richtung', () => {
    for (const tea of teas) {
      const tasteKeys = Object.keys(tea.tastes);
      expect(tasteKeys.length, tea.id).toBeGreaterThan(0);
      for (const key of tasteKeys) expect(TASTES, tea.id).toContain(key);
      expect(tea.tastes, tea.id).not.toHaveProperty('erdig');
      expect(tea.tastes, tea.id).not.toHaveProperty('herb');
      expect(tea.tastes, tea.id).not.toHaveProperty('kraeftig');
      expect(Object.keys(tea.occasions).length, tea.id).toBeGreaterThan(0);
      for (const key of Object.keys(tea.occasions)) expect(OCCASIONS, tea.id).toContain(key);
      expect(Object.keys(tea.moods).length, tea.id).toBeGreaterThan(0);
      for (const key of Object.keys(tea.moods)) expect(MOODS, tea.id).toContain(key);
    }
    for (const taste of TASTES) {
      expect(teas.some((tea) => (tea.tastes[taste] ?? 0) > 0), taste).toBe(true);
    }
    for (const occasion of OCCASIONS) {
      expect(teas.some((tea) => (tea.occasions[occasion] ?? 0) > 0), occasion).toBe(true);
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
    for (const occasion of OCCASIONS) {
      for (const time of TIMES) {
        for (const taste of TASTES) {
          for (const mood of MOODS) {
            for (const caffeine of CAFFEINE_CHOICES) {
              const result = recommend({ occasions: [occasion], tastes: [taste], times: [time], mood, caffeine });
              expect(result.length, `${occasion} ${taste} ${time} ${mood} ${caffeine}`).toBeGreaterThanOrEqual(1);
              expect(result.length).toBeLessThanOrEqual(3);
              for (let i = 1; i < result.length; i += 1) {
                expect(result[i]!.score).toBeLessThanOrEqual(result[i - 1]!.score);
              }
              expect(new Set(result.map((item) => item.tea.type)).size).toBe(result.length);
            }
          }
        }
      }
    }
  });

  it('begründet mit Anlass, Geschmack, Tageszeit und der Richtung ohne Heilaussage', () => {
    const result = recommend({
      occasions: ['abends'],
      tastes: ['blumig'],
      times: ['abend'],
      mood: 'schlaf',
      caffeine: 'egal',
    });
    expect(result[0]?.reason).toMatch(
      /passt zu Abends runterkommen, blumig und zum Abend, wird traditionell getrunken zu Abends runterkommen, häufig mit dieser Richtung verbunden: Schlaf/,
    );
    expect(result[0]?.reason).not.toMatch(/hilft bei|heilt|fördert die Verdauung|macht schlafen/i);
    expect(result[0]?.matchedTastes).toContain('blumig');
    expect(result[0]?.matchedOccasions).toContain('abends');
    expect(result[0]?.matchedMood).toBe(true);
  });

  it('schlägt am Morgen bei Wach werden, kräutig und Fokus Matcha und Mate vor', () => {
    const result = recommend({
      occasions: ['wach'],
      tastes: ['kraeutig'],
      times: ['morgen'],
      mood: 'fokus',
      caffeine: 'egal',
    });
    expect(result.map((item) => item.tea.id)).toEqual(['matcha', 'mate']);
    expect(result.every((item) => item.tea.caffeine === 'hoch')).toBe(true);
  });

  it('schlägt zum Start in den Tag bei malzig English Breakfast vor', () => {
    const result = recommend({
      occasions: ['start'],
      tastes: ['malzig'],
      times: ['morgen'],
      mood: null,
      caffeine: 'egal',
    });
    expect(result[0]?.tea.id).toBe('english-breakfast');
    expect(result[0]?.matchedMood).toBe(false);
  });

  it('schlägt am Abend bei blumig und Schlaf Kamille vor', () => {
    const result = recommend({
      occasions: ['abends'],
      tastes: ['blumig'],
      times: ['abend'],
      mood: 'schlaf',
      caffeine: 'egal',
    });
    expect(result[0]?.tea.id).toBe('kamille');
    expect(result[0]?.tea.caffeine).toBe('kein');
    expect(result.every((item) => item.tea.caffeine !== 'hoch')).toBe(true);
  });

  it('bleibt am Abend bei mild und Beruhigung ohne hohen Koffeingehalt', () => {
    const result = recommend({
      occasions: ['abends'],
      tastes: ['mild'],
      times: ['abend'],
      mood: 'beruhigung',
      caffeine: 'egal',
    });
    expect(result[0]?.tea.id).toBe('rooibos');
    expect(result.every((item) => item.tea.caffeine !== 'hoch')).toBe(true);
  });

  it('ordnet Lust auf Süßes und fruchtig am Nachmittag Apfel-Zimt vorn', () => {
    const result = recommend({
      occasions: ['suesses'],
      tastes: ['fruchtig'],
      times: ['nachmittag'],
      mood: 'beruhigung',
      caffeine: 'egal',
    });
    expect(result[0]?.tea.id).toBe('apfel-zimt');
    expect(new Set(result.map((item) => item.tea.type)).size).toBe(result.length);
  });

  it('ändert die Reihenfolge, wenn nur die Richtung wechselt', () => {
    const shared = {
      occasions: ['abends'] as Occasion[],
      tastes: ['blumig'] as Taste[],
      times: ['abend'] as TimeOfDay[],
      caffeine: 'egal' as CaffeineChoice,
    };
    const calm = recommend({ ...shared, mood: 'beruhigung' });
    const sleep = recommend({ ...shared, mood: 'schlaf' });
    expect(calm[0]?.tea.id).toBe('lavendel');
    expect(sleep[0]?.tea.id).toBe('kamille');
    expect(calm[0]?.matchedMood).toBe(true);
    expect(sleep[0]?.matchedMood).toBe(true);
  });

  it('ordnet Arbeit, Sport, Erfrischen und Schmuddelwetter passend', () => {
    expect(
      recommend({
        occasions: ['arbeit'],
        tastes: ['blumig'],
        times: ['morgen'],
        mood: 'fokus',
        caffeine: 'egal',
      })[0]?.tea.id,
    ).toBe('darjeeling');
    expect(
      recommend({
        occasions: ['sport'],
        tastes: ['minzig'],
        times: ['nachmittag'],
        mood: null,
        caffeine: 'egal',
      })[0]?.tea.id,
    ).toBe('pfefferminze');
    expect(
      recommend({
        occasions: ['erfrischen'],
        tastes: ['fruchtig'],
        times: ['nachmittag'],
        mood: null,
        caffeine: 'egal',
      })[0]?.tea.id,
    ).toBe('hibiskus');
    expect(
      recommend({
        occasions: ['schmuddel'],
        tastes: ['wuerzig'],
        times: ['nachmittag'],
        mood: null,
        caffeine: 'egal',
      })[0]?.tea.id,
    ).toBe('masala-chai');
    expect(
      recommend({
        occasions: ['nach_essen'],
        tastes: ['minzig'],
        times: ['mittag'],
        mood: null,
        caffeine: 'egal',
      })[0]?.tea.id,
    ).toBe('pfefferminze');
  });

  it('filtert bei Nein auf koffeinfreie Tees und bei Ja auf Tees mit Koffein', () => {
    const prefs = {
      occasions: ['erfrischen'] as Occasion[],
      tastes: ['fruchtig'] as Taste[],
      times: ['nachmittag'] as TimeOfDay[],
      mood: null,
    };
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
    expect(() => recommend({ occasions: [], tastes: ['blumig'], times: ['morgen'], mood: null, caffeine: 'egal' })).toThrow(
      /Anlass/,
    );
    expect(() => recommend({ tastes: [], times: ['morgen'], ...base })).toThrow(/Geschmack/);
    expect(() => recommend({ tastes: ['kraeutig'], times: ['nacht' as TimeOfDay], ...base })).toThrow(/Tageszeit/);
    expect(() => recommend({ tastes: ['kraeutig'], times: [], ...base })).toThrow(/Tageszeit/);
    expect(() => recommend({ tastes: ['suess' as Taste], times: ['mittag'], ...base })).toThrow(/Geschmack/);
    expect(() =>
      recommend({ occasions: ['abends'], tastes: ['kraeutig'], times: ['mittag'], mood: 'muede' as Mood, caffeine: 'egal' }),
    ).toThrow(/Richtung/);
    expect(() =>
      recommend({
        occasions: ['abends'],
        tastes: ['kraeutig'],
        times: ['mittag'],
        mood: 'fokus',
        caffeine: 'manchmal' as CaffeineChoice,
      }),
    ).toThrow(/Koffein/);
  });

  it('empfiehlt ohne Richtung nach Anlass, Geschmack, Tageszeit und Koffein', () => {
    const morning = recommend({
      occasions: ['wach'],
      tastes: ['malzig'],
      times: ['morgen'],
      mood: null,
      caffeine: 'egal',
    });
    expect(morning.map((item) => item.tea.id)).toEqual(['assam', 'mate']);
    expect(morning.every((item) => item.matchedMood)).toBe(false);
    expect(morning.every((item) => item.tea.caffeine === 'hoch')).toBe(true);

    const evening = recommend({
      occasions: ['abends'],
      tastes: ['blumig'],
      times: ['abend'],
      mood: null,
      caffeine: 'egal',
    });
    expect(evening[0]?.tea.id).toBe('kamille');
    expect(evening[0]?.reason).toMatch(/zum Abend, wird traditionell getrunken zu Abends runterkommen\./);
    expect(evening[0]?.reason).not.toMatch(/häufig mit dieser Richtung verbunden/);
    expect(evening.every((item) => item.tea.caffeine !== 'hoch')).toBe(true);
  });

  it('mittelt mehrere Tageszeiten und Anlässe und zählt jeden nur einmal', () => {
    const once = recommend({
      occasions: ['abends'],
      tastes: ['blumig'],
      times: ['abend'],
      mood: 'schlaf',
      caffeine: 'egal',
    });
    const twice = recommend({
      occasions: ['abends', 'abends'],
      tastes: ['blumig'],
      times: ['abend', 'abend'],
      mood: 'schlaf',
      caffeine: 'egal',
    });
    expect(twice.map((item) => ({ id: item.tea.id, score: item.score }))).toEqual(
      once.map((item) => ({ id: item.tea.id, score: item.score })),
    );

    const matcha = teas.find((tea) => tea.id === 'matcha');
    const rooibos = teas.find((tea) => tea.id === 'rooibos');
    expect(matcha).toBeDefined();
    expect(rooibos).toBeDefined();
    const morning = {
      occasions: ['wach'] as Occasion[],
      tastes: ['kraeutig'] as Taste[],
      times: ['morgen'] as TimeOfDay[],
      mood: null,
      caffeine: 'egal' as CaffeineChoice,
    };
    const bothTimes = { ...morning, times: ['morgen', 'abend'] as TimeOfDay[] };
    expect(scoreTea(matcha!, bothTimes)).toBeLessThan(scoreTea(matcha!, morning));
    expect(scoreTea(rooibos!, bothTimes)).toBeGreaterThan(scoreTea(rooibos!, morning));

    const mixed = recommend(bothTimes);
    expect(mixed.length).toBeGreaterThanOrEqual(1);
    expect(mixed.length).toBeLessThanOrEqual(3);
    expect(mixed[0]?.reason).toMatch(/zum Morgen und zum Abend/);
    expect(mixed.every((item) => item.matchedMood)).toBe(false);

    const bothOccasions = { ...morning, occasions: ['wach', 'abends'] as Occasion[] };
    expect(scoreTea(rooibos!, bothOccasions)).toBeLessThan(scoreTea(rooibos!, { ...morning, occasions: ['abends'] }));
    expect(scoreTea(matcha!, bothOccasions)).toBeLessThan(scoreTea(matcha!, morning));
  });

  it('hält Gründe frei von Wirkversprechen', () => {
    for (const occasion of OCCASIONS) {
      for (const time of TIMES) {
        for (const taste of TASTES) {
          for (const mood of [...MOODS, null]) {
            for (const item of recommend({
              occasions: [occasion],
              tastes: [taste],
              times: [time],
              mood,
              caffeine: 'egal',
            })) {
              expectNoEffectClaim(item.reason, item.tea.id);
              if (item.matchedMood) {
                expect(item.reason).toMatch(/häufig mit dieser Richtung verbunden/);
              } else {
                expect(item.reason).not.toMatch(/häufig mit dieser Richtung verbunden/);
              }
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
      'src/collections.ts',
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

  it('beschreibt Anlass und Richtung als Geschmacksorientierung', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('Wirkung / Anlass');
    expect(html).toContain('data-group="occasion"');
    expect(html).toContain('Abends runterkommen');
    expect(html).toContain('Wach werden');
    expect(html).toContain('Entspannen');
    expect(html).toContain('Nach dem Essen');
    expect(html).toContain('Erfrischen');
    expect(html).toContain('Wärmen');
    expect(html).toContain('Lust auf Süßes');
    expect(html).toContain('Nach dem Sport');
    expect(html).toContain('Konzentriert arbeiten');
    expect(html).toContain('Guter Start in den Tag');
    expect(html).toContain('Gemütlich bei Schmuddelwetter');
    expect(html).toContain('Warme Tasse bei grauem Wetter');
    expect(html).toContain('Wird traditionell getrunken zum gewählten Anlass.');
    for (const emoji of ['😴', '⚡', '🧘', '🍽️', '🧊', '🔥', '🍰', '🏃', '💻', '☀️', '🤧']) {
      expect(html, emoji).toContain(emoji);
    }
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
    expect(html).toContain('Zurück');
    expect(html).toContain('Neue Auswahl');
    expect(html).toContain('Beliebte Tees für …');
    expect(html).toContain('data-action="zurueck"');
    expect(html).toContain('data-action="neu"');
  });
});
