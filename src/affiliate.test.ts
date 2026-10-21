import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACCESSORIES } from './accessories';
import affiliateLinks from './affiliate.json';
import { isSensibleTeaSearch, withAmazonPartnerTag } from './affiliate-url';
import { AFFILIATE_NOTE } from './types';
import { renderGoPage } from './go-page';
import { teas } from './recommender';

const links = affiliateLinks as Record<string, string>;

describe('Affiliate-Konfiguration', () => {
  it('hat für jeden der 29 /go/-Slugs eine Amazon-Suche mit Partner-ID und passendem Begriff', () => {
    expect(teas).toHaveLength(29);
    const teaIds = teas.map((tea) => tea.id).sort();
    for (const id of teaIds) expect(links[id], id).toEqual(expect.any(String));

    for (const tea of teas) {
      const url = links[tea.id];
      expect(url, tea.id).toEqual(expect.any(String));
      expect(url!.trim(), tea.id).not.toBe('');

      const parsed = new URL(url!);
      expect(parsed.protocol, tea.id).toBe('https:');
      expect(parsed.hostname, tea.id).toMatch(/(^|\.)amazon\.de$/);
      expect(parsed.searchParams.get('tag'), tea.id).toBe('teelotse-21');
      expect(parsed.searchParams.getAll('tag'), tea.id).toEqual(['teelotse-21']);
      expect(withAmazonPartnerTag(url!), tea.id).toBe(url);
      expect(parsed.searchParams.get('ascsubtag'), tea.id).toBeNull();
      expect(parsed.search, tea.id).not.toMatch(/[?&](affiliate|partner|utm_[^=]+)=/i);
      const term = parsed.searchParams.get('k');
      expect(term, tea.id).toEqual(expect.any(String));
      expect(isSensibleTeaSearch(term ?? '', tea.name), `${tea.id} ${term}`).toBe(true);
      expect(parsed.pathname, tea.id).toBe('/s');
    }
  });

  it('führt Zubehör über /go/ mit tag=teelotse-21', () => {
    const teaIds = new Set(teas.map((tea) => tea.id));
    expect(ACCESSORIES.length).toBeGreaterThan(0);
    for (const item of ACCESSORIES) {
      expect(teaIds.has(item.slug), item.slug).toBe(false);
      const url = links[item.slug];
      expect(url, item.slug).toEqual(expect.any(String));
      const parsed = new URL(url!);
      expect(parsed.hostname).toMatch(/(^|\.)amazon\.de$/);
      expect(parsed.pathname).toBe('/s');
      expect(parsed.searchParams.get('tag')).toBe('teelotse-21');
      expect(isSensibleTeaSearch(parsed.searchParams.get('k') ?? '', item.name)).toBe(true);
    }
    const extra = Object.keys(links).filter((slug) => !teaIds.has(slug)).sort();
    expect(extra).toEqual(ACCESSORIES.map((item) => item.slug).sort());
  });

  it('setzt tag=teelotse-21 mit und ohne Query und ersetzt ein vorhandenes tag', () => {
    const cases = [
      ['https://www.amazon.de/s?k=Assam%20Tee', 'https://www.amazon.de/s?k=Assam%20Tee&tag=teelotse-21'],
      ['https://www.amazon.de/dp/B00TEST', 'https://www.amazon.de/dp/B00TEST?tag=teelotse-21'],
      ['https://amazon.de/s?k=Tee', 'https://amazon.de/s?k=Tee&tag=teelotse-21'],
      ['https://www.amazon.de/s?k=Tee&tag=andere-21', 'https://www.amazon.de/s?k=Tee&tag=teelotse-21'],
      ['https://www.amazon.de/s?tag=alte-21&k=Sencha%20Tee', 'https://www.amazon.de/s?k=Sencha%20Tee&tag=teelotse-21'],
      ['https://www.amazon.de/s?tag=a&k=Tee&tag=b', 'https://www.amazon.de/s?k=Tee&tag=teelotse-21'],
    ] as const;

    for (const [input, expected] of cases) {
      expect(withAmazonPartnerTag(input)).toBe(expected);
      const html = renderGoPage({ slug: 'sencha', shopUrl: input, scriptSrc: '/assets/go-redirect.js' });
      const href = expected.replaceAll('&', '&amp;');
      expect(html).toContain(`href="${href}"`);
      expect(html).toContain(`content="0;url=${href}"`);
    }

    expect(withAmazonPartnerTag('https://example.com/tee?k=1')).toBe('https://example.com/tee?k=1');
  });

  it('zeigt den Kauf-Button mit Hinweis im Footer und interner Weiterleitung', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    expect(main).toContain('Hier kaufen');
    expect(main).not.toContain('affiliate-note');
    expect(main).not.toContain('ad-tag');
    expect(main).not.toContain('Werbung/Affiliate-Link');
    expect(main).toContain('link.href = `/go/${tea.id}`');
    expect(main).toContain("setAttribute('target', '_blank')");
    expect(main).toContain("setAttribute('rel', 'sponsored noopener')");
    expect(main).toContain("setAttribute('aria-describedby', 'affiliate-hinweis')");
    expect(main).not.toContain('kauf_klick');
    expect(main).not.toContain('track(');
  });

  it('baut je Tee eine noindex-Weiterleitung mit Shop-Link', () => {
    const redirect = readFileSync('src/go-redirect.ts', 'utf8');
    expect(redirect).toContain("import './analytics'");

    for (const tea of teas) {
      const html = renderGoPage({
        slug: tea.id,
        shopUrl: links[tea.id]!,
        scriptSrc: '/assets/go-redirect.js',
      });
      expect(html, tea.id).toContain('<meta name="robots" content="noindex">');
      expect(html, tea.id).toContain('http-equiv="refresh" content="0;url=');
      expect(html, tea.id).toContain('location.replace(href)');
      expect(html, tea.id).toContain('src="/assets/go-redirect.js"');
      expect(html, tea.id).toContain(`href="${links[tea.id]!.replaceAll('&', '&amp;')}"`);
      expect(html, tea.id).toContain('rel="sponsored noopener"');
      expect(html, tea.id).toContain('>Hier kaufen</a>');
      expect(html, tea.id).not.toContain('kauf_klick');
    }
  });

  it('setzt den Affiliate-Hinweis genau einmal in den Footer jeder Seite', () => {
    for (const file of ['index.html', 'impressum.html', 'datenschutz.html', 'kontakt.html']) {
      const html = readFileSync(file, 'utf8');
      expect(html.split(AFFILIATE_NOTE).length - 1, file).toBe(1);
      expect(html, file).toContain('id="affiliate-hinweis"');
      expect(html, file).toContain('>Kontakt</a>');
      expect(html, file).not.toContain('class="affiliate-note"');
      expect(html, file).not.toContain('>Werbung</p>');
    }
    const kontakt = readFileSync('kontakt.html', 'utf8');
    expect(kontakt).toContain('href="mailto:maximilianhillert@mail.grokbot.com"');
    expect(kontakt).toContain('Fragen zur Website erreichst du über diese Adresse.');
  });

  it('erklärt Affiliate-Links und Vercel Web Analytics im Datenschutz', () => {
    const privacy = readFileSync('datenschutz.html', 'utf8');
    expect(privacy).toContain('Affiliate-Links');
    expect(privacy).toContain('externen Shop');
    expect(privacy).toContain('eigene Datenschutzerklärung');
    expect(privacy).toContain('keine personenbezogenen Daten');
    expect(privacy).toContain('Vercel Web Analytics');
    expect(privacy).toContain('Vercel Inc.');
    expect(privacy).toContain('cookielos');
    expect(privacy).toContain('keine persönlichen Profile');
    expect(privacy).toContain('zusammengefasste Seitenaufrufe');
    expect(privacy).toContain('Weiterleitungsseite');
    expect(privacy).not.toContain('kauf_klick');
  });

  it('lässt Impressum und Datenschutz ohne .html-Endung zu', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as { cleanUrls?: boolean };
    expect(config.cleanUrls).toBe(true);
  });
});
