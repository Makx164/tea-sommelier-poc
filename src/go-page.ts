import { withAmazonPartnerTag } from './affiliate-url';

export type GoPage = {
  slug: string;
  shopUrl: string;
  scriptSrc: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderGoPage({ slug, shopUrl, scriptSrc }: GoPage): string {
  if (!SLUG.test(slug)) throw new Error(`Ungültiger Tee-Slug: ${slug}`);
  const shop = new URL(withAmazonPartnerTag(shopUrl));
  if (shop.protocol !== 'https:') throw new Error(`Kauf-Link ist nicht https: ${slug}`);
  if (!scriptSrc.startsWith('/') || scriptSrc.includes('//')) {
    throw new Error(`Skriptpfad fehlt für ${slug}.`);
  }

  const href = escapeHtml(shop.href);
  const src = escapeHtml(scriptSrc);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>Weiter zum Shop – Teelotse</title>
  <meta http-equiv="refresh" content="0;url=${href}">
  <script type="module" src="${src}"></script>
  <script type="module">
    const href = document.querySelector('#shop')?.href;
    if (href) {
      document.querySelector('meta[http-equiv="refresh"]')?.remove();
      location.replace(href);
    }
  </script>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #F6F1E7; color: #1F2A2E; font-family: Inter, system-ui, sans-serif; line-height: 1.5; }
    main { max-width: 28rem; padding: 1.5rem; }
    .brand { margin: 0 0 0.8rem; font-family: Fraunces, Georgia, serif; font-weight: 600; font-size: 1.5rem; color: #2F5D50; }
    h1 { font-family: Fraunces, Georgia, serif; font-weight: 600; font-size: 1.8rem; margin: 0 0 0.6rem; }
    a { color: #2F5D50; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <p class="brand">Teelotse</p>
    <h1>Weiter zum Shop</h1>
    <p>Wenn die Weiterleitung nicht startet, nutze den Link.</p>
    <p><a id="shop" href="${href}" target="_blank" rel="sponsored noopener">Hier kaufen</a></p>
  </main>
</body>
</html>
`;
}
