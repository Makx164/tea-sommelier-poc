import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DISCOVER_LISTS } from './collections';
import { FORBIDDEN_COPY, visibleTextFromHtml } from './copy-guard';
import { HINT_EVENING_WITH_CAFFEINE, HINT_WITHOUT_CAFFEINE, teas } from './recommender';
import { MIXER_TEXT } from './mixer';
import { MOMENT_LINE } from './tea-copy';
import {
  AFFILIATE_NOTE,
  CAFFEINE_CHOICE_LABEL,
  INGREDIENTS_GAP,
  OCCASION_LABEL,
  OCCASION_NOTE,
  TASTE_LABEL,
  TIME_LABEL,
} from './types';

const PAGES = ['index.html', 'impressum.html', 'datenschutz.html', 'kontakt.html'];

function corpus(): { label: string; text: string }[] {
  const parts: { label: string; text: string }[] = [];
  for (const file of PAGES) {
    parts.push({
      label: file,
      text: visibleTextFromHtml(readFileSync(file, 'utf8')).replaceAll(AFFILIATE_NOTE, ''),
    });
  }
  for (const tea of teas) {
    parts.push({
      label: tea.id,
      text: [tea.name, tea.type, tea.origin, tea.summary, tea.brewNote, tea.caffeineDetail, tea.ingredients, MOMENT_LINE[tea.id]]
        .filter(Boolean)
        .join(' '),
    });
  }
  parts.push({
    label: 'begriffe',
    text: [
      ...Object.values(OCCASION_LABEL),
      ...Object.values(OCCASION_NOTE),
      ...Object.values(TASTE_LABEL),
      ...Object.values(TIME_LABEL),
      ...Object.values(CAFFEINE_CHOICE_LABEL),
      ...DISCOVER_LISTS.map((list) => list.title),
      HINT_WITHOUT_CAFFEINE,
      HINT_EVENING_WITH_CAFFEINE,
      INGREDIENTS_GAP,
      'Enthält Koffein',
      'Koffeinfrei',
      ...Object.values(MIXER_TEXT),
    ].join(' '),
  });
  return parts;
}

describe('Verbotsliste für sichtbare Texte', () => {
  it('findet keine Gesundheits-, Körper- oder Wirkformulierungen', () => {
    for (const entry of corpus()) {
      for (const rule of FORBIDDEN_COPY) {
        expect(entry.text, `${entry.label} trifft ${rule.id}`).not.toMatch(rule.pattern);
      }
    }
  });

  it('nennt KI und AI nirgends im sichtbaren Seitentext', () => {
    const text = corpus().map((entry) => entry.text).join('\n');
    expect(text).not.toMatch(/\bKI\b/);
    expect(text).not.toMatch(/\bAI\b/);
  });
});
