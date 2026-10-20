import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  HINT_EVENING_WITH_CAFFEINE,
  HINT_WITHOUT_CAFFEINE,
  contradictionHints,
  reasonForTea,
  recommend,
  scoreTea,
  tagScore,
  teas,
} from './recommender';
import {
  CAFFEINE_CHOICES,
  OCCASIONS,
  OCCASION_LABEL,
  OCCASION_TIME,
  TASTES,
  TASTE_LABEL,
  TIME_LABEL,
  timesForOccasions,
  type CaffeineChoice,
  type Occasion,
  type Preferences,
  type Taste,
  type Tea,
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

function withoutLabels(text: string): string {
  let rest = text;
  for (const label of [...Object.values(OCCASION_LABEL), ...Object.values(TASTE_LABEL), ...Object.values(TIME_LABEL)]) {
    rest = rest.replaceAll(label, '');
  }
  return rest;
}

function expectNoEffectClaim(text: string, label: string): void {
  for (const pattern of EFFECT_CLAIMS) {
    expect(text, `${label} ${pattern}`).not.toMatch(pattern);
  }
  const rest = withoutLabels(text);
  expect(rest, label).not.toMatch(/beruhig/i);
  expect(rest, label).not.toMatch(/schlaf/i);
  expect(rest, label).not.toMatch(/verdau/i);
  expect(rest, label).not.toMatch(/fokus/i);
  expect(rest, label).not.toMatch(/entspann/i);
}

function expectShortReason(reason: string, tea: Tea, prefs: Preferences): void {
  expect(reason.endsWith('.'), reason).toBe(true);
  expect(reason.slice(0, -1), reason).not.toContain('.');
  expect(reason, reason).not.toContain(',');
  expect((reason.match(/ und /g) ?? []).length, reason).toBeLessThanOrEqual(1);
  const passt = reason.includes('passt zu');
  const nearest = reason.includes('nächste Entsprechung');
  expect(passt || nearest, reason).toBe(true);
  expect(passt && nearest, reason).toBe(false);
  expect(reason, reason).not.toContain(tea.summary);

  const times = timesForOccasions(prefs.occasions);
  if (nearest) {
    expect(prefs.occasions.every((occasion) => (tea.occasions[occasion] ?? 0) === 0), reason).toBe(true);
    expect(prefs.tastes.every((taste) => (tea.tastes[taste] ?? 0) === 0), reason).toBe(true);
    expect(times.every((time) => (tea.times[time] ?? 0) === 0), reason).toBe(true);
    return;
  }

  const body = reason.slice(reason.indexOf('passt zu ') + 'passt zu '.length, -1);
  const parts = body.split(' und ');
  expect(parts.length, reason).toBeLessThanOrEqual(2);
  expect(parts.length, reason).toBeGreaterThan(0);
  for (const part of parts) {
    const occasionHit = prefs.occasions.some(
      (occasion) => OCCASION_LABEL[occasion] === part && (tea.occasions[occasion] ?? 0) > 0,
    );
    const tasteHit = prefs.tastes.some((taste) => TASTE_LABEL[taste] === part && (tea.tastes[taste] ?? 0) > 0);
    const timeHit = times.some((time) => TIME_LABEL[time] === part && (tea.times[time] ?? 0) > 0);
    expect(occasionHit || tasteHit || timeHit, `${tea.id} ${reason}`).toBe(true);
  }
}

const teaById = (id: string): Tea => {
  const tea = teas.find((item) => item.id === id);
  if (!tea) throw new Error(id);
  return tea;
};

describe('Datensatz', () => {
  it('enthält 29 Tees mit eindeutigen Ids', () => {
    expect(teas).toHaveLength(29);
    expect(new Set(teas.map((tea) => tea.id)).size).toBe(teas.length);
  });

  it('nutzt die acht Geschmäcker und jeden Anlass, ohne Richtung', () => {
    for (const tea of teas) {
      expect(Object.keys(tea.tastes).length, tea.id).toBeGreaterThan(0);
      for (const key of Object.keys(tea.tastes)) expect(TASTES, tea.id).toContain(key);
      expect(tea, tea.id).not.toHaveProperty('moods');
      expect(tea.tastes, tea.id).not.toHaveProperty('erdig');
      expect(tea.tastes, tea.id).not.toHaveProperty('herb');
      expect(tea.tastes, tea.id).not.toHaveProperty('kraeftig');
      expect(Object.keys(tea.occasions).length, tea.id).toBeGreaterThan(0);
      expect(Object.keys(tea.times).length, tea.id).toBeGreaterThan(0);
    }
    for (const taste of TASTES) {
      expect(teas.some((tea) => (tea.tastes[taste] ?? 0) > 0), taste).toBe(true);
    }
    for (const occasion of OCCASIONS) {
      expect(teas.some((tea) => (tea.occasions[occasion] ?? 0) > 0), occasion).toBe(true);
    }
  });

  it('führt Rooibos nicht als kräutig und Apfel-Zimt nicht als Abend', () => {
    const rooibos = teaById('rooibos');
    expect(rooibos.type).toBe('Rooibos');
    expect(rooibos.tastes.kraeutig).toBeUndefined();
    expect(rooibos.tastes.mild).toBeGreaterThan(0);

    const apfel = teaById('apfel-zimt');
    expect(apfel.times.nachmittag).toBeGreaterThan(0);
    expect(apfel.times.abend).toBeUndefined();
    expect(apfel.occasions.abend).toBeUndefined();
    expect((apfel.times.nachmittag ?? 0) > (apfel.times.abend ?? 0)).toBe(true);
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

describe('Tageszeit aus dem Anlass', () => {
  it('setzt Abendritual auf Abend und Fokussierten Start auf Morgen', () => {
    expect(timesForOccasions(['abend'])).toEqual(['abend']);
    expect(timesForOccasions(['fokus'])).toEqual(['morgen']);
    expect(OCCASION_TIME.abend).toBe('abend');
    expect(OCCASION_TIME.fokus).toBe('morgen');
  });

  it('mittelt mehrere abgeleitete Tageszeiten und zählt Momente nur einmal', () => {
    expect(timesForOccasions(['fokus', 'abend'])).toEqual(['morgen', 'abend']);
    expect(timesForOccasions(['fokus', 'fokus'])).toEqual(['morgen']);
    const matcha = teaById('matcha');
    const morning: Preferences = { occasions: ['fokus'], tastes: ['kraeutig'], caffeine: 'egal' };
    const both: Preferences = { occasions: ['fokus', 'abend'], tastes: ['kraeutig'], caffeine: 'egal' };
    const twice: Preferences = { occasions: ['fokus', 'fokus'], tastes: ['kraeutig'], caffeine: 'egal' };
    expect(scoreTea(matcha, both)).toBeLessThan(scoreTea(matcha, morning));
    expect(scoreTea(matcha, twice)).toBe(scoreTea(matcha, morning));
    expect(recommend(both)[0]?.matchedTimes).toContain('morgen');
  });
});

describe('recommend', () => {
  it('liefert je Auswahl 1 bis 3 Tees und braucht nur einen Anlass', () => {
    const tasteSets: Taste[][] = [[], ...TASTES.map((taste) => [taste])];
    for (const occasion of OCCASIONS) {
      for (const tastes of tasteSets) {
        for (const caffeine of CAFFEINE_CHOICES) {
          const result = recommend({ occasions: [occasion], tastes, caffeine });
          expect(result.length, `${occasion} ${tastes.join('+')} ${caffeine}`).toBeGreaterThanOrEqual(1);
          expect(result.length).toBeLessThanOrEqual(3);
          for (let i = 1; i < result.length; i += 1) {
            expect(result[i]!.score).toBeLessThanOrEqual(result[i - 1]!.score);
          }
          expect(new Set(result.map((item) => item.tea.type)).size).toBe(result.length);
          for (const item of result) {
            expectShortReason(item.reason, item.tea, { occasions: [occasion], tastes, caffeine });
            expectNoEffectClaim(item.reason, item.tea.id);
          }
        }
      }
    }
  });

  it('sagt passt zu nur bei echten Tags und sonst nächste Entsprechung', () => {
    const rooibos = teaById('rooibos');
    const none = reasonForTea(rooibos, { occasions: ['fokus'], tastes: ['kraeutig'], caffeine: 'egal' });
    expect(none).toBe('Rooibos ist die nächste Entsprechung.');
    expect(none).not.toMatch(/kräutig|passt zu/);

    const fit = reasonForTea(rooibos, { occasions: ['abend'], tastes: ['mild', 'kraeutig'], caffeine: 'egal' });
    expect(fit).toBe('Rooibos passt zu Abendritual und mild.');
    expect(fit).not.toMatch(/kräutig/);

    const apfel = teaById('apfel-zimt');
    const apfelReason = reasonForTea(apfel, { occasions: ['abend'], tastes: ['fruchtig'], caffeine: 'egal' });
    expect(apfelReason).toBe('Apfel-Zimt-Tee passt zu fruchtig.');
    expect(apfelReason).not.toMatch(/Abend/);

    const kamille = teaById('kamille');
    const capped = reasonForTea(kamille, { occasions: ['abend'], tastes: ['blumig'], caffeine: 'egal' });
    expect(capped).toBe('Kamillentee passt zu Abendritual und blumig.');
    expect(capped.split(' und ').some((part) => part === TIME_LABEL.abend || part.endsWith(TIME_LABEL.abend))).toBe(
      false,
    );
    expect(capped).not.toContain('honigartig');
  });

  it('nennt in passt zu höchstens zwei vorhandene Tags', () => {
    for (const tea of teas) {
      for (const occasion of OCCASIONS) {
        for (const taste of TASTES) {
          const prefs: Preferences = { occasions: [occasion], tastes: [taste], caffeine: 'egal' };
          expectShortReason(reasonForTea(tea, prefs), tea, prefs);
        }
      }
    }
  });

  it('lässt bei Koffein egal den Koffeingehalt aus der Punktzahl', () => {
    const morning: Preferences = { occasions: ['fokus'], tastes: ['malzig'], caffeine: 'egal' };
    const assam = teaById('assam');
    expect(scoreTea(assam, morning)).toBe(tagScore(assam, morning));
    expect(scoreTea(assam, { ...morning, caffeine: 'ja' })).toBeGreaterThan(scoreTea(assam, morning));

    const evening: Preferences = { occasions: ['abend'], tastes: ['mild'], caffeine: 'egal' };
    for (const item of recommend(evening)) {
      expect(item.score).toBe(tagScore(item.tea, evening));
    }
    const rooibos = teaById('rooibos');
    expect(scoreTea(rooibos, evening)).toBe(tagScore(rooibos, evening));
  });

  it('bevorzugt bei Abends und Koffein ja Tees mit wenig Koffein', () => {
    const prefs: Preferences = { occasions: ['abend'], tastes: ['rauchig'], caffeine: 'ja' };
    const hojicha = teaById('hojicha');
    const lapsang = teaById('lapsang-souchong');
    expect(hojicha.caffeine).toBe('niedrig');
    expect(lapsang.caffeine).toBe('hoch');
    expect(scoreTea(hojicha, prefs) - tagScore(hojicha, prefs)).toBeGreaterThan(
      scoreTea(lapsang, prefs) - tagScore(lapsang, prefs),
    );
    expect(scoreTea(hojicha, prefs)).toBeGreaterThan(scoreTea(lapsang, prefs));
    const result = recommend(prefs);
    expect(result[0]?.tea.id).toBe('hojicha');
    expect(result[0]?.tea.caffeine).toBe('niedrig');
    expect(result.every((item) => item.tea.caffeine !== 'hoch')).toBe(true);
  });

  it('zeigt Widerspruchs-Hinweise nur bei den genannten Paaren', () => {
    expect(contradictionHints({ occasions: ['fokus'], tastes: [], caffeine: 'nein' })).toEqual([
      HINT_WITHOUT_CAFFEINE,
    ]);
    expect(contradictionHints({ occasions: ['fokus'], tastes: ['blumig'], caffeine: 'nein' })).toEqual([
      HINT_WITHOUT_CAFFEINE,
    ]);
    expect(HINT_WITHOUT_CAFFEINE).toBe('Ohne Koffein bleibt der Geschmack klar und frisch.');
    expect(contradictionHints({ occasions: ['fokus'], tastes: [], caffeine: 'ja' })).toEqual([]);
    expect(contradictionHints({ occasions: ['fokus'], tastes: [], caffeine: 'egal' })).toEqual([]);
    expect(contradictionHints({ occasions: ['abend'], tastes: [], caffeine: 'nein' })).toEqual([]);
    expect(contradictionHints({ occasions: ['abend'], tastes: ['mild'], caffeine: 'ja' })).toEqual([
      HINT_EVENING_WITH_CAFFEINE,
    ]);
    expect(contradictionHints({ occasions: ['suesses'], tastes: [], caffeine: 'nein' })).toEqual([]);
    expect(contradictionHints({ occasions: ['abend'], tastes: [], caffeine: 'egal' })).toEqual([]);
    expect(HINT_EVENING_WITH_CAFFEINE).toMatch(/wenig Koffein/);
  });

  it('schlägt beim fokussierten Start und kräutig Matcha und Mate vor', () => {
    const result = recommend({ occasions: ['fokus'], tastes: ['kraeutig'], caffeine: 'egal' });
    expect(result.map((item) => item.tea.id)).toEqual(['matcha', 'mate']);
  });

  it('setzt Assam und English Breakfast beim malzigen Start auf dieselbe Punktzahl', () => {
    const prefs: Preferences = { occasions: ['fokus'], tastes: ['malzig'], caffeine: 'egal' };
    expect(scoreTea(teaById('assam'), prefs)).toBe(scoreTea(teaById('english-breakfast'), prefs));
    expect(recommend(prefs).map((item) => item.tea.id)).toEqual(['assam', 'mate']);
  });

  it('schlägt am Abend bei blumig Kamille vor', () => {
    const result = recommend({ occasions: ['abend'], tastes: ['blumig'], caffeine: 'egal' });
    expect(result[0]?.tea.id).toBe('kamille');
    expect(result[0]?.tea.caffeine).toBe('kein');
    expect(result[0]?.reason).toBe('Kamillentee passt zu Abendritual und blumig.');
  });

  it('ordnet Lust auf Süßes und fruchtig Apfel-Zimt vorn, ohne Abend', () => {
    const result = recommend({ occasions: ['suesses'], tastes: ['fruchtig'], caffeine: 'egal' });
    expect(result[0]?.tea.id).toBe('apfel-zimt');
    expect(result[0]?.reason).not.toMatch(/Abend/);
  });

  it('ordnet Start, Erfrischen, Aufwärmen und Nach dem Essen passend', () => {
    expect(recommend({ occasions: ['fokus'], tastes: ['blumig'], caffeine: 'egal' })[0]?.tea.id).toBe('darjeeling');
    expect(recommend({ occasions: ['erfrischen'], tastes: ['minzig'], caffeine: 'egal' })[0]?.tea.id).toBe('pfefferminze');
    expect(recommend({ occasions: ['erfrischen'], tastes: ['fruchtig'], caffeine: 'egal' })[0]?.tea.id).toBe('hibiskus');
    expect(recommend({ occasions: ['aufwaermen'], tastes: ['wuerzig'], caffeine: 'egal' })[0]?.tea.id).toBe('masala-chai');
    expect(recommend({ occasions: ['nach_essen'], tastes: ['minzig'], caffeine: 'egal' })[0]?.tea.id).toBe('pfefferminze');
  });

  it('filtert bei Nein auf koffeinfreie Tees und bei Ja auf Tees mit Koffein', () => {
    const prefs = { occasions: ['erfrischen'] as Occasion[], tastes: ['fruchtig'] as Taste[] };
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

  it('lehnt leeren Anlass und unbekannte Werte ab, Geschmack darf leer sein', () => {
    expect(() => recommend({ occasions: [], tastes: ['blumig'], caffeine: 'egal' })).toThrow(/Anlass/);
    expect(recommend({ occasions: ['abend'], tastes: [], caffeine: 'egal' }).length).toBeGreaterThan(0);
    expect(() => recommend({ occasions: ['abend'], tastes: ['suess' as Taste], caffeine: 'egal' })).toThrow(/Geschmack/);
    expect(() =>
      recommend({ occasions: ['abend'], tastes: ['kraeutig'], caffeine: 'manchmal' as CaffeineChoice }),
    ).toThrow(/Koffein/);
  });

  it('empfiehlt zum fokussierten Start bei malzig Assam vor anderen Arten', () => {
    const morning = recommend({ occasions: ['fokus'], tastes: ['malzig'], caffeine: 'egal' });
    expect(morning.map((item) => item.tea.id)).toEqual(['assam', 'mate']);
    expect(morning[0]?.reason).toBe('Assam passt zu Fokussierter Start und malzig.');
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
    const allowedHint = 'Ohne Koffein bleibt der Geschmack klar und frisch.';
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
      'KI',
    ];
    for (const file of files) {
      const text = readFileSync(file, 'utf8').replaceAll(allowedHint, '');
      for (const word of forbidden) {
        expect(text, `${file} enthält ${word}`).not.toContain(word);
      }
    }
  });

  it('nennt die sechs Momente ohne Tageszeit-Schritt und ohne Emoji', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain('Find your taste.');
    expect(html).toContain('Find your moment.');
    expect(html).toContain('Find your <em>tea</em>.');
    expect(html).not.toContain('Dein Tee für den richtigen Moment.');
    expect(html).toContain('data-group="occasion"');
    expect(html).toContain('Fokussierter Start');
    expect(html).toContain('Abendritual');
    expect(html).toContain('Nach dem Essen');
    expect(html).toContain('Aufwärmen');
    expect(html).toContain('Erfrischen &amp; Aktiv');
    expect(html).toContain('Etwas Süßes');
    expect(html).toContain('Für den fokussierten Start');
    expect(html).toContain('Für den Feierabend');
    expect(html).toContain('Für kalte Tage');
    expect(html).toContain('Beliebt nach dem Training');
    expect(html).toContain('Mehrere möglich.');
    expect(html).toContain('Optional.');
    for (const emoji of ['😴', '⚡', '🧘', '🍽️', '🧊', '🔥', '🍰', '🏃', '💻', '☀️', '🤧']) {
      expect(html, emoji).not.toContain(emoji);
    }
    expect(html).not.toContain('Wirkung / Anlass');
    expect(html).not.toContain('Wofür suchst du Tee?');
    expect(html).not.toContain('id="tageszeit"');
    expect(html).not.toContain('id="richtung"');
    expect(html).not.toContain('data-group="time"');
    expect(html).not.toContain('data-group="mood"');
    expect(html).not.toContain('Beliebte Tees für');
    expect(html).not.toContain('Für Schwangere');
    expect(html).not.toContain('Tee-Sommelier');
    expect(html).not.toContain('Verdauung');
    expect(html).toContain('Zurück');
    expect(html).toContain('Neue Auswahl');
    expect(html).toContain('Hier kaufen');
    expect(html).toContain('data-action="zurueck"');
    expect(html).toContain('data-action="neu"');
    expect(html).toContain('id="ergebnis-hinweis"');
    expect(html).toContain('Bei Schwangerschaft, Stillzeit oder Medikamenteneinnahme klär die Zutaten bitte mit Arzt, Ärztin oder Hebamme.');
    expect(readFileSync('src/main.ts', 'utf8')).toContain('dataset.count');
    expect(readFileSync('src/style.css', 'utf8')).toContain('data-count="1"');
    expect(readFileSync('src/style.css', 'utf8')).toContain('data-count="2"');
    expect(readFileSync('src/style.css', 'utf8')).toContain('prefers-reduced-motion');
  });
});
