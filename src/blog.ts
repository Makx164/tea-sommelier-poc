import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type PostImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type PostStep = {
  name: string;
  text: string;
  anchor: string;
  image?: string;
};

export type PostFaq = {
  question: string;
  answer: string;
};

export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  draft: boolean;
  updated?: string;
  tools: readonly string[];
  supplies: readonly string[];
  steps: readonly PostStep[];
  faqs: readonly PostFaq[];
  images: readonly PostImage[];
  bodyHtml: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const IMAGE = /^!\[([^\]]+)\]\((\/bilder\/blog\/[a-z0-9-]+\/[a-z0-9-]+\.webp) "([^"|]+)\|\s*(https:\/\/[^"\s]+)"\)$/;
const HEADING = /^(#{2,3}) (.+?)(?: \{(step|faq)\})?$/;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function inline(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\((\/[a-z0-9\-/]*(?:#[a-z0-9\-/]+)?)\)/g, (_match, label: string, href: string) => {
      if (href.startsWith('/go/')) {
        return `<a href="${href}" target="_blank" rel="sponsored noopener" aria-describedby="affiliate-hinweis">${label}</a>`;
      }
      return `<a href="${href}">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function plain(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value: string): string {
  const slug = value
    .toLocaleLowerCase('de-DE')
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'abschnitt';
}

function licenseFor(url: string): { licenseUrl: string; licenseName: string } {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error(`Bildnachweis ist kein https-Link: ${url}`);
  const host = parsed.hostname.replace(/^www\./, '');
  if (host === 'pexels.com') return { licenseUrl: 'https://www.pexels.com/license/', licenseName: 'Pexels' };
  if (host === 'unsplash.com') return { licenseUrl: 'https://unsplash.com/license', licenseName: 'Unsplash' };
  throw new Error(`Bildnachweis nur von Unsplash oder Pexels: ${url}`);
}

function loadFigure(logicalWebp: string): { width: number; height: number; src: string } {
  const base = logicalWebp.replace(/\.webp$/, '');
  for (const suffix of ['-640.webp', '-1280.webp', '-640.avif', '-1280.avif']) {
    const file = resolve(process.cwd(), 'public', `${base.slice(1)}${suffix}`);
    if (!existsSync(file)) throw new Error(`Bild fehlt: ${base}${suffix}`);
  }
  const metaPath = resolve(process.cwd(), 'public', `${base.slice(1)}.json`);
  if (!existsSync(metaPath)) throw new Error(`Bildmaße fehlen: ${base}.json`);
  const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as { width?: number; height?: number };
  if (!meta.width || !meta.height) throw new Error(`Bildmaße ungültig: ${base}.json`);
  return { width: meta.width, height: meta.height, src: `${base}-1280.webp` };
}

function figureHtml(options: {
  alt: string;
  src: string;
  width: number;
  height: number;
  creditName: string;
  creditUrl: string;
  licenseName: string;
  licenseUrl: string;
  eager: boolean;
}): string {
  const base = options.src.replace(/-1280\.webp$/, '');
  const sizes = '(min-width: 640px) 34rem, calc(100vw - 2.5rem)';
  const loading = options.eager ? 'eager' : 'lazy';
  return `<figure class="post-figure">
  <picture>
    <source type="image/avif" srcset="${base}-640.avif 640w, ${base}-1280.avif 1280w" sizes="${sizes}">
    <source type="image/webp" srcset="${base}-640.webp 640w, ${base}-1280.webp 1280w" sizes="${sizes}">
    <img src="${options.src}" alt="${escapeHtml(options.alt)}" width="${options.width}" height="${options.height}" loading="${loading}" decoding="async">
  </picture>
  <figcaption>Foto: <a href="${escapeHtml(options.creditUrl)}" rel="noopener noreferrer">${escapeHtml(options.creditName)}</a>, <a href="${escapeHtml(options.licenseUrl)}" rel="noopener noreferrer">${escapeHtml(options.licenseName)}</a></figcaption>
</figure>`;
}

type Rendered = {
  html: string;
  steps: PostStep[];
  faqs: PostFaq[];
  images: PostImage[];
};

/** Kleiner Markdown-Satz: Überschriften, Absätze, Listen, fett, interne Links, Bilder. */
export function renderMarkdown(markdown: string): Rendered {
  const blocks = markdown.replaceAll('\r\n', '\n').trim().split(/\n{2,}/);
  const html: string[] = [];
  const steps: PostStep[] = [];
  const faqs: PostFaq[] = [];
  const images: PostImage[] = [];
  const usedIds = new Set<string>();
  let bucket: string[] = [];
  let step: { name: string; anchor: string; image?: string } | null = null;
  let faq: { question: string } | null = null;

  function uniqueId(base: string): string {
    let id = base;
    let n = 2;
    while (usedIds.has(id)) {
      id = `${base}-${n}`;
      n += 1;
    }
    usedIds.add(id);
    return id;
  }

  function flush(): void {
    if (step) {
      const text = bucket.join('\n').trim();
      if (!text) throw new Error(`Schritt ohne Text: ${step.name}`);
      steps.push({ name: step.name, anchor: step.anchor, text, ...(step.image ? { image: step.image } : {}) });
    }
    if (faq) {
      const text = bucket.join('\n').trim();
      if (!text) throw new Error(`Frage ohne Antwort: ${faq.question}`);
      faqs.push({ question: faq.question, answer: text });
    }
    step = null;
    faq = null;
    bucket = [];
  }

  function take(text: string): void {
    if (step || faq) bucket.push(text);
  }

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length === 0) continue;
    const first = lines[0] ?? '';
    const image = lines.length === 1 ? first.match(IMAGE) : null;
    if (first.startsWith('![') && !image) throw new Error(`Bildzeile ungültig: ${first}`);
    if (image?.[1] && image[2] && image[3] && image[4]) {
      const alt = image[1].trim();
      const creditName = image[3].trim();
      const creditUrl = image[4].trim();
      if (!alt) throw new Error('Bild ohne Alt-Text.');
      if (!creditName) throw new Error('Bild ohne Fotograf.');
      const license = licenseFor(creditUrl);
      const figure = loadFigure(image[2]);
      const eager = images.length === 0;
      images.push({ src: figure.src, alt, width: figure.width, height: figure.height });
      if (step && !step.image) step.image = figure.src;
      html.push(figureHtml({
        alt,
        src: figure.src,
        width: figure.width,
        height: figure.height,
        creditName,
        creditUrl,
        licenseName: license.licenseName,
        licenseUrl: license.licenseUrl,
        eager,
      }));
      continue;
    }
    if (lines.every((line) => line.startsWith('- '))) {
      const items = lines.map((line) => line.slice(2));
      take(items.map((item) => plain(item)).join('\n'));
      html.push(`<ul>${items.map((item) => `<li>${inline(escapeHtml(item))}</li>`).join('')}</ul>`);
      continue;
    }
    const heading = first.match(HEADING);
    if (heading?.[1] && heading[2] && lines.length === 1) {
      const level = heading[1].length;
      const marker = heading[3];
      const visible = heading[2].trim();
      if (!visible) throw new Error('Leere Überschrift.');
      if (level === 2 || marker === 'faq') flush();
      const anchor = uniqueId(slugify(visible));
      const headingClass =
        marker === 'step' ? ' class="post-step"' : marker === 'faq' ? ' class="post-faq"' : visible === 'Häufige Fragen' ? ' class="post-notes"' : '';
      html.push(`<h${level} id="${anchor}"${headingClass}>${inline(escapeHtml(visible))}</h${level}>`);
      if (marker === 'step') {
        if (level !== 2) throw new Error('Schritte stehen auf einer ##-Überschrift.');
        step = { name: visible, anchor };
      } else if (marker === 'faq') {
        faq = { question: visible };
      } else if (step) {
        bucket.push(visible);
      }
      continue;
    }
    if (first.startsWith('##')) throw new Error(`Überschrift ungültig: ${first}`);
    const text = lines.join(' ');
    take(plain(text));
    html.push(`<p>${inline(escapeHtml(text))}</p>`);
  }
  flush();
  return { html: html.join('\n'), steps, faqs, images };
}

export function markdownToHtml(markdown: string): string {
  return renderMarkdown(markdown).html;
}

function field(map: Record<string, string>, key: string, file: string): string {
  const value = map[key]?.trim();
  if (!value) throw new Error(`${file}: Feld ${key} fehlt.`);
  return value;
}

function listField(map: Record<string, string>, key: string): string[] {
  const value = map[key]?.trim();
  if (!value) return [];
  return value.split(';').map((item) => item.trim()).filter((item) => item.length > 0);
}

export function parsePost(fileName: string, raw: string): Post {
  const match = raw.replace(/^\uFEFF/, '').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match?.[1] || match[2] === undefined) throw new Error(`${fileName}: Kopf fehlt.`);
  const map: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const row = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!row?.[1]) continue;
    let value = row[2]?.trim() ?? '';
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map[row[1]] = value;
  }
  const slug = fileName.replace(/\.md$/, '');
  if (!SLUG.test(slug)) throw new Error(`${fileName}: Slug ungültig.`);
  const date = field(map, 'date', fileName);
  if (!DATE.test(date)) throw new Error(`${fileName}: Datum ist kein JJJJ-MM-TT.`);
  const updated = map.updated?.trim();
  if (updated && !DATE.test(updated)) throw new Error(`${fileName}: updated ist kein JJJJ-MM-TT.`);
  const draftRaw = map.draft?.trim().toLowerCase();
  if (draftRaw !== 'true' && draftRaw !== 'false') throw new Error(`${fileName}: draft ist weder true noch false.`);
  let rendered: Rendered;
  try {
    rendered = renderMarkdown(match[2]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${fileName}: ${message}`);
  }
  return {
    slug,
    title: field(map, 'title', fileName),
    date,
    description: field(map, 'description', fileName),
    draft: draftRaw === 'true',
    ...(updated ? { updated } : {}),
    tools: listField(map, 'tools'),
    supplies: listField(map, 'supplies'),
    steps: rendered.steps,
    faqs: rendered.faqs,
    images: rendered.images,
    bodyHtml: rendered.html,
  };
}

export function loadPosts(directory: string): Post[] {
  const files = readdirSync(directory).filter((name) => name.endsWith('.md'));
  return files
    .map((name) => parsePost(name, readFileSync(resolve(directory, name), 'utf8')))
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'de'));
}

export function visiblePosts(posts: readonly Post[], includeDrafts: boolean): Post[] {
  return posts.filter((post) => includeDrafts || !post.draft);
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map((part) => Number(part));
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
