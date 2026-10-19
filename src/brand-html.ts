import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const WORTMARKE_SLOT = '<!-- teelotse-wortmarke -->';

const LOGO_PATH = resolve(process.cwd(), 'public/brand/teelotse-logo-a-wortmarke.svg');

let cached: string | undefined;

/** Inline the wordmark so Fraunces and Inter from this site apply to the logo text. */
export function wortmarkeSvg(): string {
  if (cached) return cached;
  const raw = readFileSync(LOGO_PATH, 'utf8').replace(/^\uFEFF/, '');
  cached = raw.replace(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="480" viewBox="0 0 1200 480">',
    '<svg xmlns="http://www.w3.org/2000/svg" class="logo-mark" aria-hidden="true" focusable="false" viewBox="190 125 900 230">',
  );
  if (cached === raw) throw new Error('Wortmarke ließ sich nicht einsetzen.');
  return cached;
}

export function applyBrandHtml(html: string): string {
  if (!html.includes(WORTMARKE_SLOT)) return html;
  return html.replaceAll(WORTMARKE_SLOT, wortmarkeSvg());
}
