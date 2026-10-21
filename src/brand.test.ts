import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyBrandHtml, WORTMARKE_SLOT } from './brand-html';
import { renderGoPage } from './go-page';
import { renderHead } from './site-html';

const ICON_LINKS = [
  'href="/favicon.ico" sizes="any"',
  'href="/favicon.svg" type="image/svg+xml"',
  'type="image/png" sizes="32x32" href="/favicon-32x32.png"',
  'type="image/png" sizes="16x16" href="/favicon-16x16.png"',
  'rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"',
  'rel="manifest" href="/site.webmanifest"',
];

function pngSize(file: string): [number, number] {
  const bytes = readFileSync(file);
  const ihdr = bytes.indexOf(Buffer.from('IHDR'));
  if (ihdr < 0) throw new Error(`PNG-Kopf fehlt: ${file}`);
  return [bytes.readUInt32BE(ihdr + 4), bytes.readUInt32BE(ihdr + 8)];
}

const PAGES = ['index.html', 'impressum.html', 'datenschutz.html', 'kontakt.html'];

describe('Teelotse', () => {
  it('benennt die Seiten um und nimmt den Vorschau-Hinweis weg', () => {
    for (const file of PAGES) {
      const html = readFileSync(file, 'utf8');
      expect(html, file).toContain('Teelotse');
      expect(html, file).not.toContain('Tee-Sommelier');
      expect(html, file).not.toContain('Vorschau, nicht live');
      expect(html, file).not.toContain('fonts.googleapis.com');
      expect(html, file).not.toContain('fonts.gstatic.com');
      for (const link of ICON_LINKS) expect(html, file).toContain(link);
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
    const brandIcon = readFileSync('public/brand/teelotse-logo-b-icon.svg', 'utf8');
    expect(brandIcon).toContain('fill="#2F5D50"');
    expect(brandIcon).toContain('x="100" y="100"');
    const favicon = readFileSync('public/favicon.svg', 'utf8');
    expect(favicon).toContain('M0,-38 C15,-20 15,0 0,0');
    expect(favicon).toContain('fill="#D7DDD4"');
    expect(favicon).toContain('fill="#C8743A"');
    expect(favicon).not.toContain('x="100"');
    const head = renderHead({
      title: 'Teelotse',
      description: 'Tee',
      path: '/finden',
      styleHref: '/src/style.css',
    });
    for (const link of ICON_LINKS) expect(head).toContain(link);
    const manifest = JSON.parse(readFileSync('public/site.webmanifest', 'utf8')) as {
      icons: { src: string; sizes: string }[];
    };
    expect(manifest.icons.map((icon) => icon.src)).toEqual([
      '/favicon.svg',
      '/icon-192.png',
      '/icon-512.png',
    ]);
    expect(pngSize('public/favicon-16x16.png')).toEqual([16, 16]);
    expect(pngSize('public/favicon-32x32.png')).toEqual([32, 32]);
    expect(pngSize('public/apple-touch-icon.png')).toEqual([180, 180]);
    expect(pngSize('public/icon-192.png')).toEqual([192, 192]);
    expect(pngSize('public/icon-512.png')).toEqual([512, 512]);
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
