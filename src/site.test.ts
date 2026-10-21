import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { accessoryCardsHtml } from './accessories';
import { loadPosts, parsePost } from './blog';
import { FORBIDDEN_COPY, visibleTextFromHtml } from './copy-guard';
import {
  NAV,
  injectHome,
  renderArticleDocument,
  renderBlogList,
  renderLlms,
  renderRobots,
  renderSectionDocument,
  renderSitemap,
  sitemapPaths,
} from './site-html';

const indexHtml = readFileSync('index.html', 'utf8');
const posts = loadPosts(resolve('content/blog'));

function h1Count(html: string): number {
  return html.match(/<h1[\s>]/g)?.length ?? 0;
}

describe('Navigation und Kopf', () => {
  it('nennt Finden, Entdecken, Create, Zubehör und Blog', () => {
    for (const file of ['index.html', 'impressum.html', 'datenschutz.html', 'kontakt.html']) {
      const html = readFileSync(file, 'utf8');
      const nav = html.slice(html.indexOf('<nav class="topnav"'), html.indexOf('</nav>'));
      for (const item of NAV) {
        expect(nav, file).toContain(`href="${item.href}"`);
        expect(nav, file).toContain(`>${item.label}</a>`);
      }
      expect(nav, file).not.toContain('Mischen');
    }
    expect(indexHtml).toContain('id="create"');
    expect(indexHtml).toContain('>Create</h2>');
    expect(indexHtml).toContain('Bald verfügbar.');
    expect(indexHtml).toContain('id="mixer"');
  });

  it('hält die Kopfzeile fest und zeichnet sie nach dem Scrollen um', () => {
    const css = readFileSync('src/style.css', 'utf8');
    const header = readFileSync('src/header.ts', 'utf8');
    expect(css).toMatch(/\.site-head\s*\{[^}]*position:\s*sticky/);
    expect(css).toContain('.site-head.is-scrolled');
    expect(css).toContain('prefers-reduced-motion');
    expect(header).toContain('is-scrolled');
    expect(header).toContain('scrollY');
    expect(indexHtml).toContain('class="site-head"');
  });
});

describe('Hero', () => {
  it('setzt Schriftzug und Tagline als Text über die Illustration, ohne Ecken-Labels', () => {
    expect(h1Count(indexHtml)).toBe(1);
    expect(indexHtml).toContain('<h1 id="hero-title">TEELOTSE</h1>');
    expect(indexHtml).toContain('Find your taste.');
    expect(indexHtml).toContain('Find your moment.');
    expect(indexHtml).toContain('Find your <em>tea</em>.');
    expect(indexHtml).toContain('href="#finden">Los geht\'s</a>');
    expect(indexHtml).toContain('type="image/avif"');
    expect(indexHtml).toContain('type="image/webp"');
    expect(indexHtml).toContain('alt="Leuchtturm an einer Küste, dahinter Berge, davor ruhiges Wasser."');
    for (const label of ['DEIN KOMPASS', 'FÜR GUTEN TEE', 'NATÜRLICH', 'BEWUSST']) {
      expect(indexHtml, label).not.toContain(label);
    }
    for (const file of ['640', '1120', '1792']) {
      expect(existsSync(`public/hero/leuchtturm-${file}.avif`), file).toBe(true);
      expect(existsSync(`public/hero/leuchtturm-${file}.webp`), file).toBe(true);
    }
  });
});

describe('Zubehör', () => {
  it('steht als typografische Karten mit /go/-Links im HTML', () => {
    expect(indexHtml).toContain(accessoryCardsHtml());
    expect(indexHtml).toContain('<h2 id="zubehoer-titel" class="area-title">Zubehör</h2>');
    expect(indexHtml).not.toContain('id="werbung-zubehoer"');
    expect(indexHtml).not.toContain('Für den Aufguss');
    expect(indexHtml).not.toContain('Die Links führen zu einer Shop-Suche und sind Werbung.');
    expect(indexHtml).not.toContain('Kurze Texte zu Moment, Geschmack und Zubereitung.');
    expect(indexHtml).toContain('id="zubehoer"');
    expect(indexHtml).not.toContain('tea-visual');
  });
});

describe('Blog und Sitemap', () => {
  it('führt die Beispielartikel als Entwürfe und lässt sie aus der Sitemap', () => {
    expect(posts.map((post) => post.slug).sort()).toEqual(['tee-zubereiten', 'welche-teesorte-moment']);
    expect(posts.every((post) => post.draft)).toBe(true);
    const sitemap = renderSitemap(sitemapPaths(posts));
    expect(sitemap).toContain('https://teelotse.de/blog');
    expect(sitemap).toContain('https://teelotse.de/finden');
    expect(sitemap).toContain('https://teelotse.de/kontakt');
    expect(sitemap).not.toContain('/blog/tee-zubereiten');
    expect(sitemap).not.toContain('/blog/welche-teesorte-moment');
    expect(sitemap).not.toContain('/go/');
  });

  it('zeigt Entwürfe nur, wenn die Vorschau sie ausdrücklich einblendet', () => {
    const hidden = renderBlogList(posts, false);
    const shown = renderBlogList(posts, true);
    expect(hidden).not.toContain('welche-teesorte-moment');
    expect(hidden).not.toContain('Entwurf');
    expect(shown).toContain('welche-teesorte-moment');
    expect(shown).toContain('Entwurf');
    const home = injectHome(indexHtml, posts, false);
    expect(home).not.toContain('welche-teesorte-moment');
    expect(home).toContain('application/ld+json');
    expect(home).not.toContain('AggregateRating');
    expect(home).not.toContain('FAQPage');
  });

  it('setzt auf Entwurfsseiten noindex und genau eine h1', () => {
    const post = posts[0];
    expect(post).toBeTruthy();
    const html = renderArticleDocument({
      sourceHtml: indexHtml,
      post: post!,
      styleHref: '/src/style.css',
      scriptHref: '/src/main.ts',
    });
    expect(h1Count(html)).toBe(1);
    expect(html).toContain('lang="de"');
    expect(html).toContain('noindex');
    expect(html).toContain('Entwurf');
    expect(html).toContain('BlogPosting');
    expect(html).toContain(`https://teelotse.de/blog/${post!.slug}`);
  });
});

describe('Eigene Adressen', () => {
  it('liefert je Bereich Titel, Canonical und genau eine h1', () => {
    for (const section of ['finden', 'entdecken', 'create', 'zubehoer', 'blog'] as const) {
      const html = renderSectionDocument({
        sourceHtml: indexHtml,
        section,
        posts,
        includeDrafts: false,
        styleHref: '/src/style.css',
        scriptHref: '/src/main.ts',
      });
      expect(h1Count(html), section).toBe(1);
      expect(html, section).toContain('lang="de"');
      expect(html, section).toContain(`<link rel="canonical" href="https://teelotse.de/${section}">`);
      expect(html, section).toContain('property="og:title"');
      expect(html, section).toContain('name="twitter:card"');
      expect(html, section).toContain('BreadcrumbList');
      expect(visibleTextFromHtml(html), section).not.toMatch(/\bKI\b/);
      expect(visibleTextFromHtml(html), section).not.toMatch(/\bAI\b/);
    }
  });

  it('lässt Finden, Entdecken und Create in der bekannten Form', () => {
    const finden = renderSectionDocument({
      sourceHtml: indexHtml,
      section: 'finden',
      posts,
      includeDrafts: false,
      styleHref: '/src/style.css',
      scriptHref: '/src/main.ts',
    });
    expect(finden).toContain('id="finder"');
    expect(finden).toContain('data-action="zurueck"');
    expect(finden).toContain('data-action="neu"');
    const entdecken = renderSectionDocument({
      sourceHtml: indexHtml,
      section: 'entdecken',
      posts,
      includeDrafts: false,
      styleHref: '/src/style.css',
      scriptHref: '/src/main.ts',
    });
    expect(entdecken).toContain('Alle anzeigen (7)');
    expect(entdecken).toContain('id="rest-fokus"');
  });
});

describe('Öffentliche Texte ohne KI', () => {
  it('meidet verbotene Formulierungen in Blog, llms.txt und robots.txt', () => {
    const chunks = [
      { label: 'llms', text: renderLlms() },
      { label: 'robots', text: renderRobots() },
      ...posts.map((post) => ({
        label: post.slug,
        text: `${post.title} ${post.description} ${visibleTextFromHtml(post.bodyHtml)}`,
      })),
    ];
    for (const entry of chunks) {
      for (const rule of FORBIDDEN_COPY) {
        expect(entry.text, `${entry.label} trifft ${rule.id}`).not.toMatch(rule.pattern);
      }
      expect(entry.text, entry.label).not.toMatch(/\bKI\b/);
      expect(entry.text, entry.label).not.toMatch(/\bAI\b/);
    }
    expect(renderRobots()).toContain('Sitemap: https://teelotse.de/sitemap.xml');
    expect(renderRobots()).toContain('Allow: /');
    expect(renderLlms()).toContain('https://teelotse.de/zubehoer');
  });
});

describe('Markdown', () => {
  it('liest Entwurf, Datum und Überschrift', () => {
    const post = parsePost(
      'probe.md',
      '---\ntitle: "Tee im Überblick"\ndate: 2026-10-20\ndescription: Ein Satz.\ndraft: true\n---\n\n## Wasser\n\nEin Absatz.\n',
    );
    expect(post.draft).toBe(true);
    expect(post.date).toBe('2026-10-20');
    expect(post.bodyHtml).toContain('<h2>Wasser</h2>');
    expect(post.bodyHtml).toContain('<p>Ein Absatz.</p>');
  });
});
