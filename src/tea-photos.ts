/** Ein eigenes Foto je Tee. Dieselbe Sorte behält ihr Bild, auch wenn sie in mehreren Listen steht. */

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
    key: 'assam',
    label: 'Assam',
    creditName: 'Bluesea Tea',
    creditUrl: 'https://www.pexels.com/photo/close-up-of-dry-tea-16586224/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'english-breakfast',
    label: 'English Breakfast',
    creditName: 'Ivan Babydov',
    creditUrl: 'https://www.pexels.com/photo/a-hot-beverage-in-a-cup-7790019/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'earl-grey',
    label: 'Earl Grey',
    creditName: 'Dilara',
    creditUrl: 'https://www.pexels.com/photo/tea-with-dried-oranges-served-at-cafe-20392457/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'darjeeling',
    label: 'Darjeeling First Flush',
    creditName: 'Skyler Ewing',
    creditUrl: 'https://www.pexels.com/photo/clear-glass-teacup-with-brown-liquid-9579173/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'ceylon',
    label: 'Ceylon',
    creditName: 'seymasungr',
    creditUrl: 'https://www.pexels.com/photo/cup-of-black-tea-with-almond-biscotti-on-wooden-table-32437746/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'lapsang-souchong',
    label: 'Lapsang Souchong',
    creditName: 'Evgeniy Alekseyev',
    creditUrl: 'https://www.pexels.com/photo/clear-glass-cup-with-tea-beside-a-jar-of-sugar-cubes-7333000/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'masala-chai',
    label: 'Masala Chai',
    creditName: 'Charlotte May',
    creditUrl: 'https://www.pexels.com/photo/ceramic-cup-of-chai-tea-with-cinnamon-and-star-anise-on-linen-fabric-5947062/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'sencha',
    label: 'Sencha',
    creditName: 'Eva Bronzini',
    creditUrl: 'https://www.pexels.com/photo/teapot-with-grounds-inside-6226209/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'gunpowder',
    label: 'Gunpowder',
    creditName: 'Jia Ye',
    creditUrl: 'https://unsplash.com/photos/green-tea-leaves-in-white-ceramic-bowl-with-open-lid-waTzoTvrFFs',
    licenseName: 'Unsplash',
    licenseUrl: UNSPLASH_LICENSE,
  },
  {
    key: 'jasmin',
    label: 'Jasmintee',
    creditName: 'Eva Bronzini',
    creditUrl: 'https://www.pexels.com/photo/a-pile-of-loose-jasmine-tea-leaves-5988043/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'hojicha',
    label: 'Hojicha',
    creditName: 'Eva Bronzini',
    creditUrl: 'https://www.pexels.com/photo/brown-and-black-dried-leaves-in-close-up-shot-6087684/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'genmaicha',
    label: 'Genmaicha',
    creditName: 'MART PRODUCTION',
    creditUrl: 'https://www.pexels.com/photo/close-up-shot-of-brown-grains-8108070/',
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
    key: 'bai-mu-dan',
    label: 'Bai Mu Dan',
    creditName: 'petr sidorov',
    creditUrl: 'https://unsplash.com/photos/black-and-white-flower-petals-gT_rAfFvCyw',
    licenseName: 'Unsplash',
    licenseUrl: UNSPLASH_LICENSE,
  },
  {
    key: 'silver-needle',
    label: 'Bai Hao Yinzhen',
    creditName: 'Alexey Demidov',
    creditUrl: 'https://www.pexels.com/photo/top-view-of-a-bowl-11621058/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'tie-guan-yin',
    label: 'Tie Guan Yin',
    creditName: 'swati ranjan',
    creditUrl: 'https://unsplash.com/photos/a-glass-of-tea-and-a-mug-of-tea-on-a-table-WkRbuMPnG58',
    licenseName: 'Unsplash',
    licenseUrl: UNSPLASH_LICENSE,
  },
  {
    key: 'da-hong-pao',
    label: 'Da Hong Pao',
    creditName: 'Jocelyn Morales',
    creditUrl: 'https://unsplash.com/photos/brown-dried-leaves-on-white-surface-mUrewiMZRro',
    licenseName: 'Unsplash',
    licenseUrl: UNSPLASH_LICENSE,
  },
  {
    key: 'jin-xuan',
    label: 'Jin Xuan',
    creditName: 'ORIENTO',
    creditUrl: 'https://unsplash.com/photos/clear-drinking-glass-with-liquid-on-gray-surface-MCN7xTTeAkw',
    licenseName: 'Unsplash',
    licenseUrl: UNSPLASH_LICENSE,
  },
  {
    key: 'pu-erh',
    label: 'Reifer Pu-Erh',
    creditName: 'Andy Lee',
    creditUrl: 'https://www.pexels.com/photo/elegant-display-of-pu-erh-tea-cake-and-glass-cup-32087719/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'kamille',
    label: 'Kamillentee',
    creditName: 'Beyza Efe',
    creditUrl: 'https://www.pexels.com/photo/cup-of-tea-and-bouquet-of-daisies-8257749/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'pfefferminze',
    label: 'Pfefferminztee',
    creditName: 'Mareefe',
    creditUrl: 'https://www.pexels.com/photo/peppermint-tea-on-teacup-1417945/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'lavendel',
    label: 'Lavendeltee',
    creditName: 'Fatih KÖRKÜ',
    creditUrl: 'https://www.pexels.com/photo/close-up-of-dried-lavender-flowers-in-sunlight-31474541/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'zitronenverbene',
    label: 'Zitronenverbene',
    creditName: 'Roman Odintsov',
    creditUrl: 'https://www.pexels.com/photo/branch-with-ripe-lemons-6342324/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'fenchel',
    label: 'Fencheltee',
    creditName: 'Eva Bronzini',
    creditUrl: 'https://www.pexels.com/photo/a-close-up-shot-of-a-pile-of-fennel-seeds-5988041/',
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
    key: 'hagebutte',
    label: 'Hagebuttentee',
    creditName: 'Peter Xie',
    creditUrl: 'https://www.pexels.com/photo/close-up-of-dew-kissed-rose-hips-on-branch-38216739/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'hibiskus',
    label: 'Hibiskustee',
    creditName: 'Masuma Rahaman',
    creditUrl: 'https://www.pexels.com/photo/vibrant-hibiscus-tea-in-glass-cup-38293145/',
    licenseName: 'Pexels',
    licenseUrl: PEXELS_LICENSE,
  },
  {
    key: 'apfel-zimt',
    label: 'Apfel-Zimt-Tee',
    creditName: 'Lisa Fotios',
    creditUrl: 'https://www.pexels.com/photo/a-cup-of-green-tea-with-an-apple-cut-in-half-10776450/',
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

/** Jeder Tee hat ein eigenes Bild. */
export function photoFor(tea: { id: string }): TeaPhoto {
  const photo = BY_KEY.get(tea.id);
  if (!photo) throw new Error(`Foto fehlt: ${tea.id}`);
  return photo;
}

export function teaPhotoMarkup(tea: { id: string }): string {
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
