import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { accessoryCardsHtml } from './accessories';
import { accessoryCreditsHtml } from './accessory-photos';
import affiliateLinks from './affiliate.json';
import { loadPosts, parsePost } from './blog';
import { FORBIDDEN_COPY, visibleTextFromHtml } from './copy-guard';
import {
  NAV,
  articleJsonLd,
  injectHome,
  renderArticleDocument,
  renderBlogList,
  renderLlms,
  renderRobots,
  renderSectionDocument,
  renderSitemap,
  sitemapPaths,
} from './site-html';
import { AFFILIATE_NOTE } from './types';

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
  it('setzt die dunkle Zeile mit Tasse, ohne Kicker, Unterzeile und Ecken-Labels', () => {
    expect(h1Count(indexHtml)).toBe(1);
    const hero = indexHtml.slice(indexHtml.indexOf('<section class="hero"'), indexHtml.indexOf('id="finden"'));
    expect(hero).toContain('id="hero-title"');
    expect(hero).toContain('hero-find">Find your</span>');
    expect(hero).toContain('hero-taste">taste.</span>');
    expect(hero).toContain('hero-moment">moment.</span>');
    expect(hero).toContain('hero-tea">tea.</span>');
    expect(hero).toContain('hero-line-moment');
    expect(hero).toContain('href="#finden">Los geht\'s</a>');
    expect(hero).toContain('href="#entdecken">Entdecken</a>');
    expect(hero).toContain('viewBox="0 0 420 420"');
    expect(hero).toContain('class="hero-cup" transform="translate(10 -21)"');
    expect(hero).not.toContain('TEELOTSE');
    expect(hero).not.toContain('Tee für deinen Moment.');
    expect(hero).not.toContain('hero-kicker');
    expect(hero).not.toContain('leuchtturm');
    for (const label of ['DEIN KOMPASS', 'FÜR GUTEN TEE', 'NATÜRLICH', 'BEWUSST']) {
      expect(hero, label).not.toContain(label);
    }
  });
});

describe('Zubehör', () => {
  it('steht als typografische Karten mit /go/-Links im HTML', () => {
    expect(indexHtml).toContain(accessoryCardsHtml());
    expect(indexHtml).toContain(accessoryCreditsHtml());
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
  it('führt die veröffentlichten Artikel in Blog, Sitemap und llms.txt', () => {
    expect(posts.map((post) => post.slug).sort()).toEqual([
      'earl-grey',
      'loser-tee-oder-teebeutel',
      'matcha-starterset',
      'rooibos',
      'sencha',
      'tee-zubereiten',
      'teesieb-oder-teekanne',
      'wasserkocher-fuer-tee',
      'welche-teesorte-moment',
    ]);
    expect(posts.every((post) => post.draft)).toBe(false);
    const sitemap = renderSitemap(sitemapPaths(posts));
    expect(sitemap).toContain('https://teelotse.de/blog');
    expect(sitemap).toContain('https://teelotse.de/finden');
    expect(sitemap).toContain('https://teelotse.de/kontakt');
    expect(sitemap).toContain('https://teelotse.de/blog/tee-zubereiten');
    expect(sitemap).toContain('https://teelotse.de/blog/welche-teesorte-moment');
    expect(sitemap).not.toContain('/go/');
    const llms = renderLlms(posts);
    expect(llms).toContain('https://teelotse.de/blog/tee-zubereiten');
    expect(llms).toContain('https://teelotse.de/blog/welche-teesorte-moment');
    expect(llms).toContain('Tee zubereiten: Wasser, Menge, Ziehzeit im Überblick');
    expect(llms).toContain('Welche Teesorte passt zu welchem Moment');
    expect(llms).not.toContain('/go/');
    const blog = renderSectionDocument({
      sourceHtml: indexHtml,
      section: 'blog',
      posts,
      includeDrafts: false,
      styleHref: '/src/style.css',
      scriptHref: '/src/main.ts',
    });
    expect(blog).toContain('/blog/tee-zubereiten');
    expect(blog).toContain('/blog/welche-teesorte-moment');
    for (const slug of [
      'wasserkocher-fuer-tee',
      'matcha-starterset',
      'teesieb-oder-teekanne',
      'loser-tee-oder-teebeutel',
      'sencha',
      'earl-grey',
      'rooibos',
    ]) {
      expect(sitemap).toContain(`https://teelotse.de/blog/${slug}`);
      expect(llms).toContain(`https://teelotse.de/blog/${slug}`);
      expect(blog).toContain(`/blog/${slug}`);
    }
    expect(blog).toContain('blog-card-media');
    expect(blog.match(/blog-card-media/g)?.length).toBe(posts.length);
    expect(blog).not.toContain('Temperatur, Menge und Ziehzeit je Sorte');
    expect(readFileSync('src/style.css', 'utf8')).toContain('repeat(2, minmax(0, 1fr))');
    expect(blog).toContain('/bilder/blog/tee-zubereiten/wasser-1280.webp');
    expect(blog).not.toContain('Entwurf');
    expect(renderBlogList(posts, false)).not.toContain('blog-card-media');
    expect(blog).not.toContain('Veröffentlichte Beiträge erscheinen hier.');
  });

  it('zeigt veröffentlichte Beiträge ohne Entwurf-Hinweis und blendet Entwürfe nur in der Vorschau ein', () => {
    const list = renderBlogList(posts, false);
    expect(list).toContain('welche-teesorte-moment');
    expect(list).toContain('tee-zubereiten');
    expect(list).not.toContain('Entwurf');
    const draft = parsePost(
      'entwurf.md',
      '---\ntitle: "Noch nicht soweit"\ndate: 2026-10-01\ndescription: Ein Satz.\ndraft: true\n---\n\nAbsatz.\n',
    );
    const withDraft = [draft, ...posts];
    expect(renderBlogList(withDraft, false)).not.toContain('/blog/entwurf');
    expect(renderBlogList(withDraft, true)).toContain('Entwurf');
    const home = injectHome(indexHtml, posts, false);
    expect(home).toContain('welche-teesorte-moment');
    expect(home).toContain('application/ld+json');
    expect(home).not.toContain('AggregateRating');
    expect(home).not.toContain('FAQPage');
  });

  it('setzt auf veröffentlichten Seiten index und genau eine h1', () => {
    const post = posts.find((item) => item.slug === 'tee-zubereiten');
    expect(post?.draft).toBe(false);
    const html = renderArticleDocument({
      sourceHtml: indexHtml,
      post: post!,
      styleHref: '/src/style.css',
      scriptHref: '/src/main.ts',
    });
    expect(h1Count(html)).toBe(1);
    expect(html).toContain('lang="de"');
    expect(html).toContain('index, follow');
    expect(html).not.toContain('noindex');
    expect(html).not.toContain('Entwurf');
    expect(html).toContain('BlogPosting');
    expect(html).toContain('class="post-figure post-hero"');
    expect(html.indexOf('post-hero')).toBeLessThan(html.indexOf('<h1>'));
    expect(html).toContain('https://teelotse.de/blog/tee-zubereiten');
  });

  it('setzt auf Entwurfsseiten noindex und genau eine h1', () => {
    const post = parsePost(
      'entwurf.md',
      '---\ntitle: "Noch nicht soweit"\ndate: 2026-10-01\ndescription: Ein Satz.\ndraft: true\n---\n\nAbsatz.\n',
    );
    const html = renderArticleDocument({
      sourceHtml: indexHtml,
      post,
      styleHref: '/src/style.css',
      scriptHref: '/src/main.ts',
    });
    expect(h1Count(html)).toBe(1);
    expect(html).toContain('noindex');
    expect(html).toContain('Entwurf');
    expect(html).toContain('BlogPosting');
    expect(html).toContain('https://teelotse.de/blog/entwurf');
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
    expect(entdecken).toContain('Mehr anzeigen · 7');
    expect(entdecken).toContain('id="rest-fokus"');
  });
});

describe('Öffentliche Texte ohne KI', () => {
  it('meidet verbotene Formulierungen in Blog, llms.txt und robots.txt', () => {
    const chunks = [
      { label: 'llms', text: renderLlms(posts) },
      { label: 'robots', text: renderRobots() },
      ...posts.map((post) => ({
        label: post.slug,
        text: `${post.title} ${post.description} ${visibleTextFromHtml(post.bodyHtml)}`,
      })),
      { label: 'blog-ideen', text: readFileSync('docs/blog-ideen.md', 'utf8') },
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
    expect(renderLlms(posts)).toContain('https://teelotse.de/zubehoer');
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
    expect(post.bodyHtml).toContain('<h2 id="wasser">Wasser</h2>');
    expect(post.bodyHtml).toContain('<p>Ein Absatz.</p>');
    expect(post.steps).toEqual([]);
    expect(post.faqs).toEqual([]);
  });
});

describe('Beiträge mit Anleitung und Fragen', () => {
  const teaFigures = readFileSync('src/data/teas.json', 'utf8');
  const goSlugs = new Set(Object.keys(affiliateLinks as Record<string, string>));

  function article(slug: string): string {
    const post = posts.find((item) => item.slug === slug);
    expect(post, slug).toBeTruthy();
    return renderArticleDocument({
      sourceHtml: indexHtml,
      post: post!,
      styleHref: '/src/style.css',
      scriptHref: '/src/main.ts',
    });
  }

  function jsonLd(html: string): { '@graph': Record<string, unknown>[] } {
    const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(raw).toBeTruthy();
    return JSON.parse(raw!) as { '@graph': Record<string, unknown>[] };
  }

  it('setzt HowTo und FAQPage nur auf die beiden Beiträge, mit Bildern und /go/-Links', () => {
    for (const slug of ['tee-zubereiten', 'welche-teesorte-moment'] as const) {
      const post = posts.find((item) => item.slug === slug)!;
      const html = article(slug);
      const visible = visibleTextFromHtml(html);
      expect(html).toContain('FAQPage');
      expect(html).toContain('HowTo');
      expect(html).toContain('BlogPosting');
      expect(html).toContain('dateModified');
      expect(html).toContain('Aktualisiert am');
      expect(html.split(AFFILIATE_NOTE).length - 1).toBe(1);
      expect(post.bodyHtml).not.toContain('{step}');
      expect(post.bodyHtml).not.toContain('{faq}');
      expect(post.steps.length).toBeGreaterThanOrEqual(2);
      expect(post.faqs.length).toBeGreaterThanOrEqual(2);
      expect(post.images.length).toBeGreaterThanOrEqual(3);

      const data = jsonLd(html);
      const types = data['@graph'].map((node) => node['@type']);
      expect(types).toContain('HowTo');
      expect(types).toContain('FAQPage');
      const howTo = data['@graph'].find((node) => node['@type'] === 'HowTo')!;
      const steps = howTo.step as { '@type': string; name: string; text: string; url: string }[];
      expect(steps).toHaveLength(post.steps.length);
      for (const step of steps) {
        expect(step['@type']).toBe('HowToStep');
        expect(step.text.length).toBeGreaterThan(40);
        expect(visible).toContain(step.name);
        const anchor = step.url.split('#')[1] ?? '';
        expect(html).toContain(`id="${anchor}"`);
      }
      const faq = data['@graph'].find((node) => node['@type'] === 'FAQPage')!;
      const questions = faq.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
      expect(questions).toHaveLength(post.faqs.length);
      for (const question of questions) {
        expect(visible).toContain(question.name);
        expect(visible).toContain(question.acceptedAnswer.text.slice(0, 48));
      }
      const images = howTo.image as string[];
      expect(images.length).toBe(post.images.length);
      for (const image of images) {
        expect(image).toMatch(/^https:\/\/teelotse\.de\/bilder\/blog\/.+\.webp$/);
      }

      expect(html).toContain('type="image/avif"');
      expect(html).toContain('type="image/webp"');
      expect(html).toContain('loading="eager"');
      expect(html).toContain('loading="lazy"');
      for (const image of post.images) {
        expect(html).toContain(`alt="${image.alt}"`);
        expect(html).toContain(`width="${image.width}"`);
        expect(html).toContain(`height="${image.height}"`);
        expect(existsSync(`public${image.src}`)).toBe(true);
        expect(existsSync(`public${image.src.replace('-1280.webp', '-640.webp')}`)).toBe(true);
        expect(existsSync(`public${image.src.replace('-1280.webp', '-1280.avif')}`)).toBe(true);
        expect(existsSync(`public${image.src.replace('-1280.webp', '-640.avif')}`)).toBe(true);
      }
      expect(html).toContain('Foto:');
      expect(html).toContain('https://www.pexels.com/license/');
      expect(html).not.toMatch(/https?:\/\/images\.(?:unsplash|pexels)\.com/);

      for (const href of post.bodyHtml.match(/href="(\/go\/[^"]+)"/g) ?? []) {
        const slugOfLink = href.slice('href="/go/'.length, -1);
        expect(goSlugs.has(slugOfLink), slugOfLink).toBe(true);
      }
      expect(post.bodyHtml).toContain('rel="sponsored noopener"');
      expect(post.bodyHtml).not.toContain('Affiliate');
      expect(post.bodyHtml).not.toContain('>Werbung');

      const figures = [
        ...visible.matchAll(/\d+(?:[–-]\d+)?\s*°C/g),
        ...visible.matchAll(/\d+(?:[–-]\d+)?\s*(?:Min\.|Sek\.)/g),
        ...visible.matchAll(/\d+(?:,\d+)?(?:[–-]\d+(?:,\d+)?)?\s*g auf(?: etwa)? \d+\s*ml/g),
      ].map((match) => match[0]);
      for (const figure of figures) expect(teaFigures, figure).toContain(figure);
      if (visible.includes('nicht ziehen lassen')) expect(teaFigures).toContain('nicht ziehen lassen');

      for (const name of [...post.tools, ...post.supplies]) {
        expect(visible, name).toContain(name);
      }
    }

    const home = injectHome(indexHtml, posts, false);
    expect(home).not.toContain('FAQPage');
    expect(home).not.toContain('HowTo');
    const brewed = articleJsonLd(posts.find((post) => post.slug === 'tee-zubereiten')!);
    expect(JSON.stringify(brewed)).toContain('HowToTool');
  });

  it('setzt HowTo, FAQ und Canonical auf die Ratgeber und Porträts', () => {
    const slugs = [
      'wasserkocher-fuer-tee',
      'matcha-starterset',
      'teesieb-oder-teekanne',
      'loser-tee-oder-teebeutel',
      'sencha',
      'earl-grey',
      'rooibos',
    ] as const;
    const home = injectHome(indexHtml, posts, false);
    const zubehoer = renderSectionDocument({
      sourceHtml: indexHtml,
      section: 'zubehoer',
      posts,
      includeDrafts: false,
      styleHref: '/src/style.css',
      scriptHref: '/src/main.ts',
    });
    for (const href of [
      '/blog/wasserkocher-fuer-tee',
      '/blog/matcha-starterset',
      '/blog/teesieb-oder-teekanne',
      '/blog/loser-tee-oder-teebeutel',
    ]) {
      expect(home, href).toContain(`href="${href}"`);
      expect(zubehoer, href).toContain(`href="${href}"`);
    }
    expect(indexHtml).toContain(
      'name="google-site-verification" content="qvQoba0fqIVe060UDYl-ltFRo2lQi76GWaGBifwHYfY"',
    );
    expect(JSON.stringify(affiliateLinks)).toContain('tag=teelotse-21');
    expect(JSON.stringify(affiliateLinks)).not.toContain('tag=teelotse-20');

    const photoIds = [
      ...readFileSync('src/tea-photos.ts', 'utf8').matchAll(/pexels\.com\/photo\/[^"']*?(\d+)\//g),
      ...readFileSync('src/accessory-photos.ts', 'utf8').matchAll(/pexels\.com\/photo\/[^"']*?(\d+)\//g),
      ...readFileSync('content/blog/tee-zubereiten.md', 'utf8').matchAll(/pexels\.com\/photo\/[^"']*?(\d+)\//g),
      ...readFileSync('content/blog/welche-teesorte-moment.md', 'utf8').matchAll(/pexels\.com\/photo\/[^"']*?(\d+)\//g),
    ].map((match) => match[1]);

    for (const slug of slugs) {
      const post = posts.find((item) => item.slug === slug)!;
      const html = article(slug);
      const visible = `${post.title} ${post.description} ${visibleTextFromHtml(post.bodyHtml)}`;
      const words = visible.split(/\s+/).filter((word) => word.length > 0);
      expect(words.length, slug).toBeGreaterThanOrEqual(700);
      expect(words.length, slug).toBeLessThanOrEqual(1100);
      expect(html).toContain(`<link rel="canonical" href="https://teelotse.de/blog/${slug}">`);
      expect(html).toContain(`<title>${post.title} – Teelotse</title>`);
      expect(html).toContain('HowTo');
      expect(html).toContain('FAQPage');
      expect(html).toContain('BlogPosting');
      expect(html).toContain('index, follow');
      expect(post.steps.length, slug).toBeGreaterThanOrEqual(2);
      expect(post.faqs.length, slug).toBeGreaterThanOrEqual(2);
      expect(post.images.length, slug).toBeGreaterThanOrEqual(1);
      expect(post.bodyHtml).toContain('rel="sponsored noopener"');
      const blogLinks = new Set(post.bodyHtml.match(/href="\/blog\/[^"]+"/g) ?? []);
      expect(blogLinks.size, slug).toBeGreaterThanOrEqual(2);
      expect(post.bodyHtml, slug).toMatch(/href="\/(?:entdecken|zubehoer|create)/);
      for (const name of [...post.tools, ...post.supplies]) {
        expect(visible, `${slug} ${name}`).toContain(name);
      }
      const figures = [
        ...visible.matchAll(/\d+(?:[–-]\d+)?\s*°C/g),
        ...visible.matchAll(/\d+(?:[–-]\d+)?\s*(?:Min\.|Sek\.)/g),
        ...visible.matchAll(/\d+(?:,\d+)?(?:[–-]\d+(?:,\d+)?)?\s*g auf(?: etwa)? \d+\s*ml/g),
      ].map((match) => match[0]);
      for (const figure of figures) expect(teaFigures, `${slug} ${figure}`).toContain(figure);
      for (const href of post.bodyHtml.match(/href="(\/go\/[^"]+)"/g) ?? []) {
        const slugOfLink = href.slice('href="/go/'.length, -1);
        expect(goSlugs.has(slugOfLink), slugOfLink).toBe(true);
      }
      for (const image of post.images) {
        expect(existsSync(`public${image.src}`)).toBe(true);
        expect(html).toContain('Foto:');
      }
      for (const id of post.bodyHtml.match(/pexels\.com\/photo\/[^"']*?(\d+)\//g) ?? []) {
        const photoId = id.match(/(\d+)\//)?.[1] ?? '';
        expect(photoIds, `${slug} ${photoId}`).not.toContain(photoId);
        photoIds.push(photoId);
      }
    }
  });
});
