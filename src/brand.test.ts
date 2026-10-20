import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyBrandHtml, WORTMARKE_SLOT } from './brand-html';
import { renderGoPage } from './go-page';

const PAGES = ['index.html', 'impressum.html', 'datenschutz.html'];

describe('Teelotse', () => {
  it('benennt die Seiten um und nimmt den Vorschau-Hinweis weg', () => {
    for (const file of PAGES) {
      const html = readFileSync(file, 'utf8');
      expect(html, file).toContain('Teelotse');
      expect(html, file).not.toContain('Tee-Sommelier');
      expect(html, file).not.toContain('Vorschau, nicht live');
      expect(html, file).not.toContain('fonts.googleapis.com');
      expect(html, file).not.toContain('fonts.gstatic.com');
      expect(html, file).toContain('/brand/teelotse-logo-b-icon.svg');
      expect(html.match(new RegExp(WORTMARKE_SLOT, 'g'))?.length, file).toBe(2);
    }
    const home = readFileSync('index.html', 'utf8');
    expect(home).toContain('Find your taste.');
    expect(home).toContain('id="finden"');
    expect(home).toContain('id="finder"');
    expect(home).not.toContain('Tee-Sommelier');
  });

  it('setzt die Wortmarke aus der Markendatei ein', () => {
    const html = applyBrandHtml(`<a class="logo">${WORTMARKE_SLOT}</a>`);
    const source = readFileSync('public/brand/teelotse-logo-a-wortmarke.svg', 'utf8');
    expect(html).toContain('class="logo-mark"');
    expect(html).toContain('M0,-38 C15,-20 15,0 0,0');
    expect(html).toContain('>Teelotse</text>');
    expect(source).toContain('>Teelotse</text>');
    expect(readFileSync('public/brand/teelotse-logo-b-icon.svg', 'utf8')).toContain('fill="#2F5D50"');
  });

  it('lädt die Schriften von dieser Seite', () => {
    const css = readFileSync('src/style.css', 'utf8');
    for (const hex of ['#1F3C2D', '#FFFCF5', '#2A312E', '#E6E7E2']) {
      expect(css).toContain(hex);
    }
    expect(css).toContain('font-family: "Bodoni Moda Variable"');
    expect(css).toContain('font-family: "Great Vibes"');
    expect(css).toContain("font-family: Fraunces");
    expect(css).toContain("font-family: Inter");
    expect(css).toContain('bodoni-moda-latin-opsz-normal.woff2');
    expect(css).toContain('great-vibes-latin-400-normal.woff2');
    expect(css).toContain('fraunces-latin-full-normal.woff2');
    expect(css).toContain('inter-latin-wght-normal.woff2');
    expect(css).not.toContain('fonts.googleapis.com');
    expect(readFileSync('src/main.ts', 'utf8')).toContain('#finder');
  });

  it('nennt die Weiterleitung Teelotse', () => {
    const html = renderGoPage({
      slug: 'sencha',
      shopUrl: 'https://www.amazon.de/s?k=Sencha%20Tee',
      scriptSrc: '/assets/go-redirect.js',
    });
    expect(html).toContain('Weiter zum Shop – Teelotse');
    expect(html).not.toContain('Tee-Sommelier');
    expect(html).toContain('#FFFCF5');
    expect(html).toContain('#1F3C2D');
  });
});
