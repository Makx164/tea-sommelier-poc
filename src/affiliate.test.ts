import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import affiliateLinks from './affiliate.json';
import { renderGoPage } from './go-page';
import { teas } from './recommender';

const links = affiliateLinks as Record<string, string>;

describe('Affiliate-Konfiguration', () => {
  it('hat für jeden Tee eine https-Kauf-URL ohne Partner-ID', () => {
    expect(Object.keys(links).sort()).toEqual(teas.map((tea) => tea.id).sort());

    for (const tea of teas) {
      const url = links[tea.id];
      expect(url, tea.id).toEqual(expect.any(String));
      expect(url!.trim(), tea.id).not.toBe('');

      const parsed = new URL(url!);
      expect(parsed.protocol, tea.id).toBe('https:');
      expect(parsed.hostname.length, tea.id).toBeGreaterThan(0);
      expect(parsed.searchParams.get('tag'), tea.id).toBeNull();
      expect(parsed.searchParams.get('ascsubtag'), tea.id).toBeNull();
      expect(parsed.search, tea.id).not.toMatch(/[?&](affiliate|partner|utm_[^=]+)=/i);
    }
  });

  it('zeigt den Kauf-Button mit Hinweis und interner Weiterleitung', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    expect(main).toContain('Hier kaufen');
    expect(main).toContain(
      'Werbung/Affiliate-Link: Bei Kauf erhalten wir ggf. eine Provision, für dich ändert sich der Preis nicht.',
    );
    expect(main).toContain('link.href = `/go/${tea.id}`');
    expect(main).toContain("setAttribute('target', '_blank')");
    expect(main).toContain("setAttribute('rel', 'sponsored noopener')");
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
