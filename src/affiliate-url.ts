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
