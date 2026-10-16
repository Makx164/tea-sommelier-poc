export const AMAZON_PARTNER_TAG = 'teelotse-21';

function isAmazonDe(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === 'amazon.de' || host.endsWith('.amazon.de');
}

function queryParamName(part: string): string {
  const eq = part.indexOf('=');
  const raw = eq === -1 ? part : part.slice(0, eq);
  try {
    return decodeURIComponent(raw.replaceAll('+', ' '));
  } catch {
    return raw;
  }
}

function foldedWords(value: string): string[] {
  return value
    .toLocaleLowerCase('de-DE')
    .replaceAll('ä', 'ae')
    .replaceAll('ö', 'oe')
    .replaceAll('ü', 'ue')
    .replaceAll('ß', 'ss')
    .replace(/tee/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3);
}

/** Suchbegriff nennt den Tee, nicht nur „Tee“ und nicht ein fremdes Produkt. */
export function isSensibleTeaSearch(term: string, teaName: string): boolean {
  const termWords = foldedWords(term);
  const nameWords = foldedWords(teaName);
  if (termWords.length === 0 || nameWords.length === 0) return false;
  return nameWords.some((word) => termWords.includes(word));
}

/** Hängt die PartnerNet-ID an amazon.de-URLs an und ersetzt ein vorhandenes tag. */
export function withAmazonPartnerTag(rawUrl: string): string {
  const url = new URL(rawUrl);
  if (!isAmazonDe(url.hostname)) return rawUrl;

  const hashIndex = rawUrl.indexOf('#');
  const withoutHash = hashIndex === -1 ? rawUrl : rawUrl.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : rawUrl.slice(hashIndex);
  const queryIndex = withoutHash.indexOf('?');
  const path = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : withoutHash.slice(queryIndex + 1);

  const kept = query
    .split('&')
    .filter((part) => part.length > 0 && queryParamName(part) !== 'tag');

  kept.push(`tag=${encodeURIComponent(AMAZON_PARTNER_TAG)}`);
  return `${path}?${kept.join('&')}${hash}`;
}
