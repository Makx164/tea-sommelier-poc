import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  draft: boolean;
  bodyHtml: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function inline(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\((\/[a-z0-9\-/]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

/** Kleiner Markdown-Satz: Überschriften, Absätze, Listen, fett, interne Links. */
export function markdownToHtml(markdown: string): string {
  const blocks = markdown.replaceAll('\r\n', '\n').trim().split(/\n{2,}/);
  return blocks
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
      if (lines.length === 0) return '';
      const first = lines[0] ?? '';
      if (lines.every((line) => line.startsWith('- '))) {
        const items = lines.map((line) => `<li>${inline(escapeHtml(line.slice(2)))}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      if (first.startsWith('### ')) return `<h3>${inline(escapeHtml(first.slice(4)))}</h3>`;
      if (first.startsWith('## ')) return `<h2>${inline(escapeHtml(first.slice(3)))}</h2>`;
      return `<p>${inline(escapeHtml(lines.join(' ')))}</p>`;
    })
    .filter((block) => block.length > 0)
    .join('\n');
}

function field(map: Record<string, string>, key: string, file: string): string {
  const value = map[key]?.trim();
  if (!value) throw new Error(`${file}: Feld ${key} fehlt.`);
  return value;
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
  const draftRaw = map.draft?.trim().toLowerCase();
  if (draftRaw !== 'true' && draftRaw !== 'false') throw new Error(`${fileName}: draft ist weder true noch false.`);
  return {
    slug,
    title: field(map, 'title', fileName),
    date,
    description: field(map, 'description', fileName),
    draft: draftRaw === 'true',
    bodyHtml: markdownToHtml(match[2]),
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
