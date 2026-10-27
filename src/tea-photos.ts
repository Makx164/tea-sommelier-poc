/** Ein Foto je Teeart. Matcha und Pfefferminze weichen ab, weil Pulver und Minze sonst falsch aussähen. */

const PEXELS_LICENSE = 'https://www.pexels.com/license/';
const UNSPLASH_LICENSE = 'https://unsplash.com/license';

export type TeaPhoto = {
  key: string;
  label: string;
  creditName: string;
  creditUrl: string;
  licenseName: string;
  licenseUrl: string;
};

export const TEA_PHOTOS: readonly TeaPhoto[] = [
  {
    key: 'schwarztee',
    label: 'Schwarztee',
    creditName: 'Bluesea Tea',
    creditUrl: 'https://www.pexels.com/photo/close-up-of-dry-tea-16586224/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'gruentee',
    label: 'Grüntee',
    creditName: 'Eva Bronzini',
    creditUrl: 'https://www.pexels.com/photo/teapot-with-grounds-inside-6226209/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'matcha',
    label: 'Matcha',
    creditName: 'Cup of Couple',
    creditUrl: 'https://www.pexels.com/photo/matcha-powder-in-bowl-8474056/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'weisstee',
    label: 'Weißtee',
    creditName: 'Alexey Demidov',
    creditUrl: 'https://www.pexels.com/photo/top-view-of-a-bowl-11621058/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'oolong',
    label: 'Oolong',
    creditName: 'swati ranjan',
    creditUrl: 'https://unsplash.com/photos/a-glass-of-tea-and-a-mug-of-tea-on-a-table-WkRbuMPnG58',
    licenseName: 'Unsplash',
    licenseUrl: UNSPLASH_LICENSE,
  },
  {
    key: 'pu-erh',
    label: 'Pu-Erh',
    creditName: 'Andy Lee',
    creditUrl: 'https://www.pexels.com/photo/elegant-display-of-pu-erh-tea-cake-and-glass-cup-32087719/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'kraeutertee',
    label: 'Kräutertee',
    creditName: 'lil artsy',
    creditUrl: 'https://www.pexels.com/photo/white-and-brown-ceramic-mug-1793034/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'pfefferminze',
    label: 'Pfefferminze',
    creditName: 'Mareefe',
    creditUrl: 'https://www.pexels.com/photo/peppermint-tea-on-teacup-1417945/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'rooibos',
    label: 'Rooibos',
    creditName: 'Özgür Beşli',
    creditUrl: 'https://www.pexels.com/photo/close-up-shot-of-a-cup-of-tea-11452391/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'fruechtetee',
    label: 'Früchtetee',
    creditName: 'Masuma Rahaman',
    creditUrl: 'https://www.pexels.com/photo/vibrant-hibiscus-tea-in-glass-cup-38293145/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'mate',
    label: 'Mate',
    creditName: 'Egor Komarov',
    creditUrl: 'https://www.pexels.com/photo/close-up-photo-of-yerba-mate-herbs-15347182/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
];

const BY_KEY = new Map(TEA_PHOTOS.map((photo) => [photo.key, photo]));

const TYPE_KEY: Record<string, string> = {
  Schwarztee: 'schwarztee',
  Grüntee: 'gruentee',
  Weißtee: 'weisstee',
  Oolong: 'oolong',
  'Pu-Erh': 'pu-erh',
  Kräutertee: 'kraeutertee',
  Rooibos: 'rooibos',
  Früchtetee: 'fruechtetee',
  Mate: 'mate',
};

/** Pfefferminze und Matcha haben ein eigenes Bild, alle anderen die Teeart. */
export function photoFor(tea: { id: string; type: string }): TeaPhoto {
  const key = tea.id === 'matcha' || tea.id === 'pfefferminze' ? tea.id : TYPE_KEY[tea.type];
  const photo = key ? BY_KEY.get(key) : undefined;
  if (!photo) throw new Error(`Foto fehlt: ${tea.type}`);
  return photo;
}

export function teaPhotoMarkup(tea: { id: string; type: string }): string {
  const photo = photoFor(tea);
  const base = `/bilder/tees/${photo.key}`;
  return `<span class="tea-photo"><picture><source type="image/avif" srcset="${base}-320.avif 320w, ${base}-640.avif 640w" sizes="5rem"><source type="image/webp" srcset="${base}-320.webp 320w, ${base}-640.webp 640w" sizes="5rem"><img src="${base}-320.webp" alt="" width="320" height="320" loading="lazy" decoding="async"></picture></span>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Gesammelt, nicht auf der Karte. Pexels und Unsplash bitten um Nennung, verlangen sie nicht. */
export function photoCreditsHtml(): string {
  const items = TEA_PHOTOS.map((photo) => {
    return `<li>${escapeHtml(photo.label)}: <a href="${escapeHtml(photo.creditUrl)}" rel="noopener noreferrer">${escapeHtml(photo.creditName)}</a>, <a href="${escapeHtml(photo.licenseUrl)}" rel="noopener noreferrer">${escapeHtml(photo.licenseName)}</a></li>`;
  }).join('');
  return `<details class="photo-credits" id="bildnachweis"><summary>Bildnachweis</summary><ul>${items}</ul></details>`;
}
