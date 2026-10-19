import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DISCOVER_LISTS, MIN_LIST_WEIGHT, teasForList } from './collections';
import { discoverListsHtml } from './discover-html';
import { MOMENT_LINE } from './tea-copy';
import { caffeineFact } from './types';

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
  /für schwangere/i,
  /schwangere kaufen/i,
];

describe('Entdecken', () => {
  it('nennt die sechs Listen nach Anlass, ohne Gruppen und ohne Schwangerschaft', () => {
    expect(DISCOVER_LISTS.map((list) => list.title)).toEqual([
      'Für den fokussierten Start',
      'Für den Feierabend',
      'Nach dem Essen',
      'Für kalte Tage',
      'Beliebt nach dem Training',
      'Etwas Süßes',
    ]);
    const titles = DISCOVER_LISTS.map((list) => list.title).join(' ');
    expect(titles).not.toMatch(/Schwanger|Sportler|Gestresst|Einsteiger/i);
  });

  it('nimmt nur Tees mit Moment-Gewicht ab 2 und sortiert danach', () => {
    for (const list of DISCOVER_LISTS) {
      const entries = teasForList(list);
      expect(entries.length, list.id).toBeGreaterThan(0);
      for (let index = 1; index < entries.length; index += 1) {
        const prev = entries[index - 1]!;
        const next = entries[index]!;
        expect(next.weight).toBeLessThanOrEqual(prev.weight);
        expect(next.weight).toBeGreaterThanOrEqual(MIN_LIST_WEIGHT);
      }
      for (const entry of entries) {
        expect(entry.tea.occasions[list.occasion]).toBeGreaterThanOrEqual(MIN_LIST_WEIGHT);
        expect(MOMENT_LINE[entry.tea.id], entry.tea.id).toBeTruthy();
        const prose = `${list.title} ${MOMENT_LINE[entry.tea.id]}`;
        for (const pattern of EFFECT_CLAIMS) {
          expect(prose, String(pattern)).not.toMatch(pattern);
        }
      }
    }
  });

  it('steht fertig im HTML, mit Werbung und /go/-Link', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain(discoverListsHtml());
    for (const list of DISCOVER_LISTS) {
      expect(html).toContain(list.title);
      for (const entry of teasForList(list)) {
        expect(html).toContain(`href="/go/${entry.tea.id}"`);
        expect(html).toContain(caffeineFact(entry.tea.caffeine));
        expect(html).toContain(`${entry.tea.temperature}, ${entry.tea.steepTime}`);
      }
    }
    expect(html).toContain('rel="sponsored noopener"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('>Werbung</p>');
    expect(html).toContain('>Hier kaufen</a>');
  });
});
