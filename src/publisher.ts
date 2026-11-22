import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type PublisherFacts = {
  name: string;
  street: string;
  postalCode: string;
  locality: string;
  email: string;
};

/** Anschrift und E-Mail stehen im Impressum. Andere Seiten übernehmen diese Werte. */
export function readPublisher(html?: string): PublisherFacts {
  const source = html ?? readFileSync(resolve(process.cwd(), 'impressum.html'), 'utf8');
  const block = source.match(/<address class="contact">([\s\S]*?)<\/address>/);
  if (!block?.[1]) throw new Error('Impressum ohne Anschrift.');
  const lines = block[1]
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const name = lines[0];
  const street = lines[1];
  const place = lines[2]?.match(/^(\d{5})\s+(.+)$/);
  const email = source.match(/mailto:([^"]+)/)?.[1];
  if (!name || !street || !place?.[1] || !place[2] || !email) throw new Error('Impressum unvollständig.');
  return {
    name,
    street,
    postalCode: place[1],
    locality: place[2].trim(),
    email,
  };
}
