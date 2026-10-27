/** Ein eigenes Foto je Zubehör. Kein Bild wird doppelt verwendet. */

const PEXELS_LICENSE = 'https://www.pexels.com/license/';

export type AccessoryPhoto = {
  slug: string;
  label: string;
  creditName: string;
  creditUrl: string;
  licenseName: string;
  licenseUrl: string;
};

export const ACCESSORY_PHOTOS: readonly AccessoryPhoto[] = [
  {
    slug: 'teesieb',
    label: 'Teesieb',
    creditName: 'Lucas Oliveira',
    creditUrl: 'https://www.pexels.com/photo/close-up-photograph-of-a-tea-infuser-4780859/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    slug: 'teekanne',
    label: 'Teekanne',
    creditName: 'Cup of Couple',
    creditUrl: 'https://www.pexels.com/photo/tea-in-a-clear-glass-pot-7303162/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    slug: 'thermokanne',
    label: 'Thermoskanne',
    creditName: 'Tima Miroshnichenko',
    creditUrl: 'https://www.pexels.com/photo/person-holding-stainless-steel-vacuum-flask-7879984/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    slug: 'teebecher',
    label: 'Teebecher und Teetasse',
    creditName: 'Cihan Yüce',
    creditUrl: 'https://www.pexels.com/photo/green-tea-in-white-ceramic-cup-12338992/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    slug: 'teefilter',
    label: 'Teefilter',
    creditName: 'Olga Kovalski',
    creditUrl: 'https://www.pexels.com/photo/close-up-of-a-silver-kitchen-sieve-20558794/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    slug: 'wasserkocher',
    label: 'Wasserkocher',
    creditName: 'Mohammad abasi',
    creditUrl: 'https://www.pexels.com/photo/stylish-black-electric-kettle-on-marble-surface-30946793/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    slug: 'waage',
    label: 'Waage',
    creditName: 'Cihan Yüce',
    creditUrl: 'https://www.pexels.com/photo/close-up-of-weighing-coffee-beans-12176062/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    slug: 'bambusbesen',
    label: 'Bambusbesen',
    creditName: 'Anna Pou',
    creditUrl: 'https://www.pexels.com/photo/bamboo-whisk-in-close-up-photography-8329648/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
];

const BY_SLUG = new Map(ACCESSORY_PHOTOS.map((photo) => [photo.slug, photo]));

export function accessoryPhotoFor(slug: string): AccessoryPhoto {
  const photo = BY_SLUG.get(slug);
  if (!photo) throw new Error(`Zubehör-Foto fehlt: ${slug}`);
  return photo;
}

export function accessoryPhotoMarkup(slug: string): string {
  accessoryPhotoFor(slug);
  const base = `/bilder/zubehoer/${slug}`;
  return `<span class="tea-photo"><picture><source type="image/avif" srcset="${base}-320.avif 320w, ${base}-640.avif 640w" sizes="5rem"><source type="image/webp" srcset="${base}-320.webp 320w, ${base}-640.webp 640w" sizes="5rem"><img src="${base}-320.webp" alt="" width="320" height="320" loading="lazy" decoding="async"></picture></span>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Gesammelt unter den Karten, nicht auf der einzelnen Karte. */
export function accessoryCreditsHtml(): string {
  const items = ACCESSORY_PHOTOS.map((photo) => {
    return `<li>${escapeHtml(photo.label)}: <a href="${escapeHtml(photo.creditUrl)}" rel="noopener noreferrer">${escapeHtml(photo.creditName)}</a>, <a href="${escapeHtml(photo.licenseUrl)}" rel="noopener noreferrer">${escapeHtml(photo.licenseName)}</a></li>`;
  }).join('');
  return `<details class="photo-credits" id="bildnachweis-zubehoer"><summary>Bildnachweis</summary><ul>${items}</ul></details>`;
}
