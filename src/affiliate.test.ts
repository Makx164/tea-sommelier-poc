import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import affiliateLinks from './affiliate.json';
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

  it('zeigt den Kauf-Button mit Hinweis und dem Ereignis kauf_klick', () => {
    const main = readFileSync('src/main.ts', 'utf8');
    expect(main).toContain('Hier kaufen');
    expect(main).toContain(
      'Werbung/Affiliate-Link: Bei Kauf erhalten wir ggf. eine Provision, für dich ändert sich der Preis nicht.',
    );
    expect(main).toContain("setAttribute('target', '_blank')");
    expect(main).toContain("setAttribute('rel', 'sponsored noopener')");
    expect(main).toContain("track('kauf_klick', { tee: tea.name })");
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
    expect(privacy).toContain('Seitenaufrufe und Ereignisse');
  });

  it('lässt Impressum und Datenschutz ohne .html-Endung zu', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as { cleanUrls?: boolean };
    expect(config.cleanUrls).toBe(true);
  });
});
