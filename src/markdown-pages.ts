import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ACCESSORIES } from './accessories';
import { formatDate, loadPosts, visiblePosts, type Post } from './blog';
import { DISCOVER_LISTS, teasForList } from './collections';
import { MIXER_TEXT } from './mixer';
import { teas } from './recommender';
import { OCCASIONS, OCCASION_LABEL, OCCASION_NOTE, TASTES, TASTE_LABEL } from './types';

export const MARKDOWN_TYPE = 'text/markdown; charset=utf-8';

const STATIC_PAGES = ['/impressum', '/datenschutz', '/kontakt', '/ueber-uns'] as const;

export type MarkdownResult = {
  status: 200 | 404;
  contentType: string;
  vary: 'Accept';
  body: string;
};

function normalize(pathname: string): string {
  const path = pathname.split('?')[0] ?? '';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path || '/';
}

export function wantsMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  return accept.split(',').some((part) => {
    const [type, ...params] = part.trim().toLowerCase().split(';');
    if (type?.trim() !== 'text/markdown') return false;
    const quality = params.map((item) => item.trim()).find((item) => item.startsWith('q='));
    if (!quality) return true;
    const value = Number(quality.slice(2));
    return Number.isFinite(value) && value > 0;
  });
}

function hasPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** Seitenartige Pfade, deren Antwort von Accept abhängt. Dateien und /go/ nicht. */
export function isPageLike(pathname: string): boolean {
  const path = normalize(pathname);
  if (path.includes('.')) return false;
  for (const prefix of ['/go', '/agent-md', '/assets', '/bilder', '/brand', '/src', '/hero']) {
    if (hasPrefix(path, prefix)) return false;
  }
  return true;
}

export function notFoundMarkdown(): string {
  return `# Seite nicht gefunden

Diese Adresse gibt es auf Teelotse nicht. Die Sitemap listet die vorhandenen Seiten. Ein Überblick für Assistenten steht in llms.txt.

- [Sitemap](/sitemap.xml)
- [Überblick für Assistenten](/llms.txt)
`;
}

function decode(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function inline(value: string): string {
  const withLinks = value.replace(
    /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href: string, label: string) => `[${decode(label.replace(/<[^>]+>/g, '')).trim()}](${href})`,
  );
  return decode(withLinks.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function htmlMainToMarkdown(html: string): string {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
  let text = main.replace(/<script[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, (_match, inner: string) => `\n# ${inline(inner)}\n\n`);
  text = text.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_match, inner: string) => `\n## ${inline(inner)}\n\n`);
  text = text.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, (_match, inner: string) => `\n### ${inline(inner)}\n\n`);
  text = text.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_match, inner: string) => `\n- ${inline(inner)}\n`);
  text = text.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_match, inner: string) => `\n${inline(inner)}\n\n`);
  text = text.replace(/<address\b[^>]*>([\s\S]*?)<\/address>/gi, (_match, inner: string) => `\n${inline(inner)}\n\n`);
  text = inline(text);
  return `${text.trim()}\n`;
}

function articleBody(slug: string): string {
  const raw = readFileSync(resolve(process.cwd(), 'content/blog', `${slug}.md`), 'utf8');
  const body = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/)?.[1] ?? raw;
  return body.trim();
}

function teaLine(id: string, name: string): string {
  return `[${name}](/entdecken#tee-${id})`;
}

function homeMarkdown(posts: readonly Post[]): string {
  const articles = posts
    .map((post) => `- [${post.title}](/blog/${post.slug}): ${post.description}`)
    .join('\n');
  return `# Teelotse

Find your moment.
Find your taste.
Find your tea.

Teelotse ist ein deutscher Teeratgeber. Die Seite schlägt ein bis drei Tees vor, nach Moment, Geschmack und Koffein, nennt Temperatur, Ziehzeit und Menge aus dem Datensatz und sammelt Kaufratgeber zu Tee-Zubehör.

## Seiten

- [Finden](/finden): Moment, Geschmack und Koffein. Ein bis drei Sorten.
- [Entdecken](/entdecken): Tees nach Anlass.
- [Create](/create): Vorschau zum Zusammenstellen, noch ohne Bestellung.
- [Zubehör](/zubehoer): Sieb, Kanne und weiteres Gerät. Kauf-Links sind Werbung.
- [Blog](/blog): Ratgeber und Sortenporträts.
- [Über uns](/ueber-uns)
- [Kontakt](/kontakt)

## Beiträge

${articles}
`;
}

function findenMarkdown(): string {
  const moments = OCCASIONS.map((id) => `- ${OCCASION_LABEL[id]}: ${OCCASION_NOTE[id]}`).join('\n');
  const tastes = TASTES.map((id) => TASTE_LABEL[id]).join(', ');
  const rows = teas
    .map(
      (tea) =>
        `| ${teaLine(tea.id, tea.name)} | ${tea.temperature} | ${tea.steepTime} | ${tea.amount} |`,
    )
    .join('\n');
  return `# Finden

Tee für den Moment vorschlagen lassen. Pflicht ist ein Moment, mehrere sind möglich. Geschmack kann leer bleiben. Koffein steht vorausgewählt auf Egal. Die Auswahl bleibt im Browser, es gibt kein Konto und keine Speicherung. Die Vorschläge sind ein bis drei Tees, nach denselben Regeln wie auf der Seite.

## Momente

${moments}

## Geschmack

${tastes}.

## Koffein

Ja, Nein oder Egal.

## Zubereitung aus dem Datensatz

| Tee | Temperatur | Ziehzeit | Menge |
| --- | --- | --- | --- |
${rows}

Mehr zum Aufguss: [Tee zubereiten](/blog/tee-zubereiten).
`;
}

function entdeckenMarkdown(): string {
  const lists = DISCOVER_LISTS.map((list) => {
    const items = teasForList(list)
      .map((entry) => `- ${teaLine(entry.tea.id, entry.tea.name)}`)
      .join('\n');
    return `## ${list.title}\n\n${items}`;
  }).join('\n\n');
  return `# Entdecken

Tees nach Anlass. Jede Sorte verlinkt auf ihre Karte.

${lists}
`;
}

function createMarkdown(): string {
  return `# Create

Bald verfügbar.

${MIXER_TEXT.empty} ${MIXER_TEXT.sum} ${MIXER_TEXT.preview}
`;
}

function zubehoerMarkdown(posts: readonly Post[]): string {
  const cards = ACCESSORIES.map((item) => `- [${item.name}](/go/${item.slug}): ${item.line}`).join('\n');
  const guides = posts.map((post) => `- [${post.title}](/blog/${post.slug})`).join('\n');
  return `# Zubehör

Sieb, Kanne und weiteres Gerät für den Tee im Alltag. Die Kauf-Links sind Werbung.

${cards}

## Ratgeber

${guides}
`;
}

function blogIndexMarkdown(posts: readonly Post[]): string {
  const articles = posts
    .map((post) => `- [${post.title}](/blog/${post.slug}): ${post.description}`)
    .join('\n');
  return `# Blog

Ratgeber zu Zubehör und Zubereitung, dazu Porträts einzelner Sorten.

${articles}
`;
}

function articleMarkdown(post: Post): string {
  const updated = post.updated ? `\nAktualisiert am ${formatDate(post.updated)}.\n` : '';
  return `# ${post.title}

${post.description}

Veröffentlicht am ${formatDate(post.date)}.${updated}

${articleBody(post.slug)}
`;
}

type Cache = {
  includeDrafts: boolean;
  pages: Map<string, string>;
};

let cache: Cache | null = null;

function buildPages(includeDrafts: boolean): Map<string, string> {
  const posts = visiblePosts(loadPosts(resolve(process.cwd(), 'content/blog')), includeDrafts);
  const pages = new Map<string, string>();
  pages.set('/', homeMarkdown(posts));
  pages.set('/finden', findenMarkdown());
  pages.set('/entdecken', entdeckenMarkdown());
  pages.set('/create', createMarkdown());
  pages.set('/zubehoer', zubehoerMarkdown(posts));
  pages.set('/blog', blogIndexMarkdown(posts));
  for (const post of posts) pages.set(`/blog/${post.slug}`, articleMarkdown(post));
  for (const path of STATIC_PAGES) {
    const file = resolve(process.cwd(), `${path.slice(1)}.html`);
    pages.set(path, htmlMainToMarkdown(readFileSync(file, 'utf8')));
  }
  return pages;
}

export function markdownPages(includeDrafts = false): Map<string, string> {
  if (!cache || cache.includeDrafts !== includeDrafts) {
    cache = { includeDrafts, pages: buildPages(includeDrafts) };
  }
  return cache.pages;
}

export function resetMarkdownCache(): void {
  cache = null;
}

export function markdownFor(pathname: string, includeDrafts = false): string | null {
  return markdownPages(includeDrafts).get(normalize(pathname)) ?? null;
}

export function negotiate(
  pathname: string,
  accept: string | null | undefined,
  includeDrafts = false,
): MarkdownResult | null {
  if (!wantsMarkdown(accept) || !isPageLike(pathname)) return null;
  const body = markdownFor(pathname, includeDrafts);
  if (body && body.trim().length > 0) {
    return { status: 200, contentType: MARKDOWN_TYPE, vary: 'Accept', body };
  }
  return { status: 404, contentType: MARKDOWN_TYPE, vary: 'Accept', body: notFoundMarkdown() };
}
