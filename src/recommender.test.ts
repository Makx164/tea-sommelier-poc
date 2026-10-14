import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { recommend, teas } from './recommender';
import { TASTES, TIMES, type Taste, type TimeOfDay } from './types';

const BANNED = [
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
  /immun/i,
  /kopfschmerz/i,
  /entspann/i,
  /wohltu/i,
  /magen/i,
  /erkält/i,
  /fokus/i,
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
];

describe('Datensatz', () => {
  it('enthält 20 bis 30 Tees mit eindeutigen Ids', () => {
    expect(teas.length).toBeGreaterThanOrEqual(20);
    expect(teas.length).toBeLessThanOrEqual(30);
    expect(new Set(teas.map((tea) => tea.id)).size).toBe(teas.length);
  });

  it('beschreibt Geschmack und Zubereitung ohne Wirkversprechen', () => {
    for (const tea of teas) {
      const text = JSON.stringify(tea);
      for (const pattern of BANNED) {
        expect(text, `${tea.id} ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});

describe('recommend', () => {
  it('liefert je Auswahl 1 bis 3 Tees in absteigender Punktzahl', () => {
    for (const time of TIMES) {
      for (const taste of TASTES) {
        const result = recommend({ tastes: [taste], time });
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result.length).toBeLessThanOrEqual(3);
        for (let i = 1; i < result.length; i += 1) {
          expect(result[i]!.score).toBeLessThanOrEqual(result[i - 1]!.score);
        }
        expect(new Set(result.map((item) => item.tea.type)).size).toBe(result.length);
      }
    }
  });

  it('begründet mit dem gewählten Geschmack und der Tageszeit', () => {
    const result = recommend({ tastes: ['erdig', 'mild'], time: 'nachmittag' });
    expect(result[0]?.reason).toMatch(/passt zum Nachmittag/);
    expect(result[0]?.matchedTastes.every((taste) => taste === 'erdig' || taste === 'mild')).toBe(true);
  });

  it('schlägt am Morgen bei kräftig Assam, Matcha und Mate vor', () => {
    const result = recommend({ tastes: ['kraeftig'], time: 'morgen' });
    expect(result.map((item) => item.tea.id)).toEqual(['assam', 'matcha', 'mate']);
    expect(result.every((item) => item.tea.caffeine === 'hoch')).toBe(true);
  });

  it('schlägt am Abend bei mild und blumig koffeinarme Tees vor', () => {
    const result = recommend({ tastes: ['mild', 'blumig'], time: 'abend' });
    expect(result.map((item) => item.tea.id)).toEqual(['kamille', 'rooibos', 'silver-needle']);
    expect(result[0]?.tea.caffeine).toBe('kein');
    expect(result.every((item) => item.tea.caffeine === 'kein' || item.tea.caffeine === 'niedrig')).toBe(true);
  });

  it('bleibt am Abend bei kräftig ohne hohen Koffeingehalt', () => {
    const result = recommend({ tastes: ['kraeftig'], time: 'abend' });
    expect(result.map((item) => item.tea.id)).toEqual(['pfefferminze', 'hagebutte']);
    expect(result.every((item) => item.tea.caffeine === 'kein')).toBe(true);
  });

  it('mischt bei fruchtig am Nachmittag Frucht, Kraut und Schwarztee', () => {
    const result = recommend({ tastes: ['fruchtig'], time: 'nachmittag' });
    expect(result.map((item) => item.tea.id)).toEqual(['apfel-zimt', 'zitronenverbene', 'darjeeling']);
  });

  it('ordnet erdig am Nachmittag Hojicha, Da Hong Pao und Pu-Erh', () => {
    const result = recommend({ tastes: ['erdig'], time: 'nachmittag' });
    expect(result.map((item) => item.tea.id)).toEqual(['hojicha', 'da-hong-pao', 'pu-erh']);
  });

  it('ordnet mild und blumig am Morgen Darjeeling, Bai Hao Yinzhen und Jasmin', () => {
    const result = recommend({ tastes: ['mild', 'blumig'], time: 'morgen' });
    expect(result.map((item) => item.tea.id)).toEqual(['darjeeling', 'silver-needle', 'jasmin']);
  });

  it('lehnt leere oder unbekannte Auswahl ab', () => {
    expect(() => recommend({ tastes: [], time: 'morgen' })).toThrow(/Geschmack/);
    expect(() => recommend({ tastes: ['herb'], time: 'nacht' as TimeOfDay })).toThrow(/Tageszeit/);
    expect(() => recommend({ tastes: ['suess' as Taste], time: 'mittag' })).toThrow(/Geschmack/);
  });

  it('hält Gründe frei von Wirkversprechen', () => {
    for (const time of TIMES) {
      for (const taste of TASTES) {
        for (const item of recommend({ tastes: [taste], time })) {
          for (const pattern of BANNED) {
            expect(item.reason, item.tea.id).not.toMatch(pattern);
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
      'belebend',
      'Völlegefühl',
      'Magenproblem',
      'n8n',
    ];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const word of forbidden) {
        expect(text, `${file} enthält ${word}`).not.toContain(word);
      }
    }
  });
});
