import { readFileSync } from 'node:fs';

const AMAZON_TAG = 'teelotse-21';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function foldedWords(value) {
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

function isSensibleTeaSearch(term, teaName) {
  const termWords = foldedWords(term);
  const nameWords = foldedWords(teaName);
  if (termWords.length === 0 || nameWords.length === 0) return false;
  return nameWords.some((word) => termWords.includes(word));
}

function isAmazonHost(hostname) {
  const host = hostname.toLowerCase();
  return host === 'amazon.de' || host.endsWith('.amazon.de');
}

const teas = JSON.parse(readFileSync(new URL('../src/data/teas.json', import.meta.url), 'utf8'));
const accessories = JSON.parse(readFileSync(new URL('../src/accessories.json', import.meta.url), 'utf8'));
const links = JSON.parse(readFileSync(new URL('../src/affiliate.json', import.meta.url), 'utf8'));

if (!Array.isArray(teas) || teas.length !== 29) {
  console.error(`Erwartet 29 Tees, gefunden ${Array.isArray(teas) ? teas.length : 0}.`);
  process.exit(1);
}

if (!Array.isArray(accessories) || accessories.length === 0) {
  console.error('Zubehör fehlt.');
  process.exit(1);
}

const failures = [];

function fail(slug, message) {
  failures.push(`${slug}: ${message}`);
}

const targets = [
  ...teas.map((tea) => ({ id: tea.id, name: tea.name })),
  ...accessories.map((item) => ({ id: item.slug, name: item.name })),
];

for (const item of targets) {
  if (!SLUG.test(item.id)) fail(item.id, 'Slug passt nicht zu /go/.');
  const raw = links[item.id];
  if (typeof raw !== 'string' || !raw) {
    fail(item.id, 'Keine Kauf-URL.');
    continue;
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail(item.id, 'URL unlesbar.');
    continue;
  }
  if (url.protocol !== 'https:' || !isAmazonHost(url.hostname)) {
    fail(item.id, `Keine https-Amazon-URL: ${raw}`);
  }
  if (url.pathname !== '/s') fail(item.id, `Keine Suche: ${url.pathname}`);
  if (url.searchParams.get('tag') !== AMAZON_TAG) fail(item.id, 'tag ist nicht teelotse-21.');
  const term = url.searchParams.get('k') ?? '';
  if (!isSensibleTeaSearch(term, item.name)) {
    fail(item.id, `Suchbegriff passt nicht zu „${item.name}“: ${term}`);
  }
}

if (Object.keys(links).length !== targets.length) {
  fail('affiliate', `affiliate.json hat ${Object.keys(links).length} Einträge, nicht ${targets.length}.`);
}

async function resolveOne(item) {
  const target = links[item.id];
  const response = await fetch(target, {
    redirect: 'follow',
    signal: AbortSignal.timeout(25000),
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'de-DE,de;q=0.9,en;q=0.8',
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    },
  });
  const finalUrl = new URL(response.url);
  if (!isAmazonHost(finalUrl.hostname)) {
    throw new Error(`landet nicht auf Amazon (${response.status} ${finalUrl.hostname})`);
  }
  const finalTag = finalUrl.searchParams.get('tag');
  if (finalTag && finalTag !== AMAZON_TAG) {
    throw new Error(`Antwort-URL hat tag=${finalTag}`);
  }
  return { status: response.status, finalUrl: finalUrl.toString() };
}

const queue = [...targets];
const results = [];

async function worker() {
  for (;;) {
    const item = queue.shift();
    if (!item) return;
    try {
      const resolved = await resolveOne(item);
      results.push({ id: item.id, ...resolved });
      console.log(`ok  /go/${item.id}  ${resolved.status}  ${resolved.finalUrl}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      fail(item.id, `Aufruf fehlgeschlagen: ${message}`);
      console.error(`fail /go/${item.id}  ${message}`);
    }
  }
}

if (failures.length === 0) {
  await Promise.all([worker(), worker(), worker(), worker()]);
}

if (failures.length) {
  console.error(`\n${failures.length} Problem(e):`);
  for (const line of failures) console.error(`- ${line}`);
  process.exit(1);
}

console.log(`\n${targets.length} /go/-Slugs führen auf Amazon mit tag=${AMAZON_TAG}.`);
