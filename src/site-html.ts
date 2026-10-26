import { formatDate, visiblePosts, type Post } from './blog';
import { DISCOVER_LISTS, teasForList } from './collections';

export const SITE = 'https://teelotse.de';

export const NAV = [
  { href: '/finden', label: 'Finden' },
  { href: '/entdecken', label: 'Entdecken' },
  { href: '/create', label: 'Create' },
  { href: '/zubehoer', label: 'Zubehör' },
  { href: '/blog', label: 'Blog' },
] as const;

export type SectionId = 'finden' | 'entdecken' | 'create' | 'zubehoer' | 'blog';

export const SECTION_META: Record<SectionId, { title: string; description: string; path: string; label: string }> = {
  finden: {
    title: 'Finden – Teelotse',
    description: 'Tee für den Moment vorschlagen lassen. Sechs Momente, Geschmack nach Wunsch, Koffein. Die Auswahl bleibt im Browser.',
    path: '/finden',
    label: 'Finden',
  },
  entdecken: {
    title: 'Entdecken – Teelotse',
    description: 'Tees nach Anlass: fokussierter Start, Feierabend, nach dem Essen, kalte Tage, nach dem Training, etwas Süßes.',
    path: '/entdecken',
    label: 'Entdecken',
  },
  create: {
    title: 'Create – Teelotse',
    description: 'Create ist eine Vorschau. Bis zu fünf Teesorten, die Anteile bleiben zusammen bei 100 %. Noch ohne Bestellung.',
    path: '/create',
    label: 'Create',
  },
  zubehoer: {
    title: 'Zubehör – Teelotse',
    description: 'Sieb, Kanne, Thermoskanne, Becher und Filter für den Tee im Alltag. Die Kauf-Links sind Werbung.',
    path: '/zubehoer',
    label: 'Zubehör',
  },
  blog: {
    title: 'Blog – Teelotse',
    description: 'Kurze Texte zu Moment, Geschmack und Zubereitung.',
    path: '/blog',
    label: 'Blog',
  },
};

const HOME = {
  title: 'Teelotse – Tee für deinen Moment',
  description: 'Finde deinen Tee für den Moment. Teelotse schlägt ein bis drei Tees vor, nach Geschmack und Koffein.',
  path: '/',
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function pageUrl(path: string): string {
  if (path === '/') return `${SITE}/`;
  return `${SITE}${path}`;
}

export function jsonLdScript(data: unknown): string {
  const json = JSON.stringify(data).replaceAll('<', '\\u003c');
  return `<script type="application/ld+json">${json}</script>`;
}

function organization(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    name: 'Teelotse',
    url: `${SITE}/`,
    logo: `${SITE}/brand/teelotse-logo-b-icon.svg`,
    email: 'maximilianhillert@mail.grokbot.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Illgnerstraße 35',
      postalCode: '04442',
      addressLocality: 'Zwenkau',
      addressCountry: 'DE',
    },
  };
}

function teaLists(): Record<string, unknown>[] {
  return DISCOVER_LISTS.map((list) => {
    const entries = teasForList(list);
    return {
      '@type': 'ItemList',
      name: list.title,
      url: `${SITE}/entdecken#liste-${list.id}`,
      numberOfItems: entries.length,
      itemListElement: entries.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: entry.tea.name,
        url: `${SITE}/entdecken#liste-${list.id}`,
      })),
    };
  });
}

export function homeJsonLd(): unknown {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Teelotse',
        url: `${SITE}/`,
        description: HOME.description,
        inLanguage: 'de',
      },
      organization(),
      ...teaLists(),
    ],
  };
}

export function sectionJsonLd(section: SectionId): unknown {
  const meta = SECTION_META[section];
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      name: meta.title,
      description: meta.description,
      url: pageUrl(meta.path),
      inLanguage: 'de',
      isPartOf: { '@type': 'WebSite', name: 'Teelotse', url: `${SITE}/` },
    },
    breadcrumbData([{ name: 'Teelotse', path: '/' }, { name: meta.label, path: meta.path }]),
  ];
  if (section === 'entdecken' || section === 'finden') graph.push(...teaLists());
  if (section === 'zubehoer') {
    graph.push({
      '@type': 'ItemList',
      name: 'Zubehör',
      url: pageUrl('/zubehoer'),
      itemListElement: [
        'Teesieb',
        'Teekanne',
        'Thermoskanne',
        'Teebecher und Teetasse',
        'Teefilter',
      ].map((name, index) => ({ '@type': 'ListItem', position: index + 1, name })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

function breadcrumbData(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: pageUrl(item.path),
    })),
  };
}

export function articleJsonLd(post: Post): unknown {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        inLanguage: 'de',
        mainEntityOfPage: pageUrl(`/blog/${post.slug}`),
        author: { '@type': 'Organization', name: 'Teelotse', url: `${SITE}/` },
        publisher: organization(),
      },
      breadcrumbData([
        { name: 'Teelotse', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: `/blog/${post.slug}` },
      ]),
    ],
  };
}

export function renderHead(options: {
  title: string;
  description: string;
  path: string;
  styleHref: string;
  jsonLd?: unknown;
  robots?: string;
  ogType?: string;
}): string {
  const url = pageUrl(options.path);
  const robots = options.robots ?? 'index, follow';
  const json = options.jsonLd ? `\n  ${jsonLdScript(options.jsonLd)}` : '';
  return `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title)}</title>
  <meta name="description" content="${escapeHtml(options.description)}">
  <link rel="canonical" href="${escapeHtml(url)}">
  <meta name="robots" content="${escapeHtml(robots)}">
  <meta property="og:type" content="${escapeHtml(options.ogType ?? 'website')}">
  <meta property="og:site_name" content="Teelotse">
  <meta property="og:locale" content="de_DE">
  <meta property="og:title" content="${escapeHtml(options.title)}">
  <meta property="og:description" content="${escapeHtml(options.description)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:image" content="https://teelotse.de/hero/leuchtturm-1120.webp">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(options.title)}">
  <meta name="twitter:description" content="${escapeHtml(options.description)}">
  <meta name="twitter:image" content="https://teelotse.de/hero/leuchtturm-1120.webp">
  <meta name="theme-color" content="#FFFCF5">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">${json}
  <link rel="stylesheet" href="${escapeHtml(options.styleHref)}">`;
}

export function sliceMarked(html: string, name: string): string {
  const start = `<!-- ${name} -->`;
  const end = `<!-- /${name} -->`;
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from < 0 || to < from) throw new Error(`Marker fehlt: ${name}`);
  return html.slice(from + start.length, to).trim();
}

export function replaceMarked(html: string, name: string, replacement: string): string {
  const start = `<!-- ${name} -->`;
  const end = `<!-- /${name} -->`;
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from < 0 || to < from) throw new Error(`Marker fehlt: ${name}`);
  return `${html.slice(0, from)}${replacement}${html.slice(to + end.length)}`;
}

export function renderBlogList(posts: readonly Post[], includeDrafts: boolean): string {
  const visible = visiblePosts(posts, includeDrafts);
  if (visible.length === 0) {
    return '<p class="hint">Veröffentlichte Beiträge erscheinen hier.</p>';
  }
  const cards = visible
    .map((post) => {
      const flag = post.draft ? '\n            <p class="draft-flag">Entwurf</p>' : '';
      return `          <a class="blog-card" href="/blog/${escapeHtml(post.slug)}">
            <p class="blog-date"><time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time></p>${flag}
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.description)}</p>
          </a>`;
    })
    .join('\n');
  return `<div class="blog-list">\n${cards}\n          </div>`;
}

export function injectHome(html: string, posts: readonly Post[], includeDrafts: boolean): string {
  const withBlog = replaceMarked(html, 'blog:list', renderBlogList(posts, includeDrafts));
  return withBlog.replace('<!-- jsonld:home -->', jsonLdScript(homeJsonLd()));
}

function markCurrent(headerHtml: string, path: string): string {
  const href = `href="${path}"`;
  if (!headerHtml.includes(href)) return headerHtml;
  return headerHtml.replace(href, `${href} aria-current="page"`);
}

function promoteFirstHeading(sectionHtml: string): string {
  return sectionHtml.replace('<h2 ', '<h1 ').replace('</h2>', '</h1>');
}

function crumbs(items: { name: string; path?: string }[]): string {
  const parts = items
    .map((item, index) => {
      const last = index === items.length - 1;
      if (last || !item.path) return `<li aria-current="page">${escapeHtml(item.name)}</li>`;
      return `<li><a href="${escapeHtml(item.path)}">${escapeHtml(item.name)}</a></li>`;
    })
    .join('');
  return `<nav class="crumbs wrap" aria-label="Brotkrumen"><ol>${parts}</ol></nav>`;
}

function documentHtml(options: {
  head: string;
  header: string;
  main: string;
  footer: string;
  scriptHref: string;
}): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
${options.head}
</head>
<body>
  <a class="skip" href="#inhalt">Zum Inhalt</a>
  ${options.header}
  <main id="inhalt" class="page">
    ${options.main}
  </main>
  ${options.footer}
  <script type="module" src="${escapeHtml(options.scriptHref)}"></script>
</body>
</html>
`;
}

export function renderSectionDocument(options: {
  sourceHtml: string;
  section: SectionId;
  posts: readonly Post[];
  includeDrafts: boolean;
  styleHref: string;
  scriptHref: string;
}): string {
  const meta = SECTION_META[options.section];
  const prepared = injectHome(options.sourceHtml, options.posts, options.includeDrafts);
  const header = markCurrent(sliceMarked(prepared, 'chrome:header'), meta.path);
  const footer = sliceMarked(prepared, 'chrome:footer');
  const sectionHtml = promoteFirstHeading(sliceMarked(prepared, `section:${options.section}`));
  const main = `${crumbs([
    { name: 'Teelotse', path: '/' },
    { name: meta.label },
  ])}
    ${sectionHtml}`;
  return documentHtml({
    head: renderHead({
      title: meta.title,
      description: meta.description,
      path: meta.path,
      styleHref: options.styleHref,
      jsonLd: sectionJsonLd(options.section),
    }),
    header,
    main,
    footer,
    scriptHref: options.scriptHref,
  });
}

export function renderArticleDocument(options: {
  sourceHtml: string;
  post: Post;
  styleHref: string;
  scriptHref: string;
}): string {
  const header = markCurrent(sliceMarked(options.sourceHtml, 'chrome:header'), '/blog');
  const footer = sliceMarked(options.sourceHtml, 'chrome:footer');
  const flag = options.post.draft ? '\n      <p class="draft-flag">Entwurf</p>' : '';
  const main = `${crumbs([
    { name: 'Teelotse', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: options.post.title },
  ])}
    <article class="wrap prose article">
      <p class="eyebrow">Blog</p>${flag}
      <h1>${escapeHtml(options.post.title)}</h1>
      <p class="blog-date"><time datetime="${escapeHtml(options.post.date)}">${escapeHtml(formatDate(options.post.date))}</time></p>
      <p class="area-lead">${escapeHtml(options.post.description)}</p>
      ${options.post.bodyHtml}
    </article>`;
  return documentHtml({
    head: renderHead({
      title: `${options.post.title} – Teelotse`,
      description: options.post.description,
      path: `/blog/${options.post.slug}`,
      styleHref: options.styleHref,
      jsonLd: articleJsonLd(options.post),
      robots: options.post.draft ? 'noindex, follow' : 'index, follow',
      ogType: 'article',
    }),
    header,
    main,
    footer,
    scriptHref: options.scriptHref,
  });
}

export function sitemapPaths(posts: readonly Post[]): string[] {
  const paths = ['/', ...NAV.map((item) => item.href), '/impressum', '/datenschutz', '/kontakt'];
  for (const post of visiblePosts(posts, false)) paths.push(`/blog/${post.slug}`);
  return paths;
}

export function renderSitemap(paths: readonly string[]): string {
  const urls = paths.map((path) => `  <url><loc>${escapeHtml(pageUrl(path))}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function renderRobots(): string {
  return `User-agent: *
Allow: /
Disallow: /go/

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: Bingbot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: Bytespider
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
}

export function renderLlms(posts: readonly Post[] = []): string {
  const articles = visiblePosts(posts, false)
    .map((post) => `- ${SITE}/blog/${post.slug} — ${post.title}`)
    .join('\n');
  const articleBlock = articles.length > 0 ? `\n## Beiträge\n\n${articles}\n` : '';
  return `# Teelotse

Teelotse ist eine Website für Tee nach Moment, Geschmack und Koffein. Sie schlägt aus einem festen Satz gängiger Tees ein bis drei Sorten vor und listet Tees nach Anlass. Create ist eine Vorschau zum Zusammenstellen, noch ohne Bestellung. Zubehör verlinkt auf Shop-Suchen und ist als Werbung gekennzeichnet. Es gibt keine eigenen Produkte. Die Texte bleiben bei Geschmack, Aroma, Temperatur, Moment, Herkunft und Zubereitung.

## Seiten

- Start: ${SITE}/
- Finden: ${SITE}/finden
- Entdecken: ${SITE}/entdecken
- Create: ${SITE}/create
- Zubehör: ${SITE}/zubehoer
- Blog: ${SITE}/blog
- Impressum: ${SITE}/impressum
- Datenschutz: ${SITE}/datenschutz
- Kontakt: ${SITE}/kontakt
${articleBlock}`;
}
