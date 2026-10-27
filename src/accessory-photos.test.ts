import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACCESSORIES } from './accessories';
import { accessoryCreditsHtml, accessoryPhotoMarkup, ACCESSORY_PHOTOS } from './accessory-photos';
import { FORBIDDEN_COPY } from './copy-guard';
import { TEA_PHOTOS } from './tea-photos';

describe('Zubehörbilder', () => {
  it('gibt jedem Zubehör ein eigenes Foto', () => {
    expect(ACCESSORY_PHOTOS).toHaveLength(ACCESSORIES.length);
    const slugs = ACCESSORY_PHOTOS.map((photo) => photo.slug);
    expect(new Set(slugs).size).toBe(ACCESSORIES.length);
    expect(slugs).toEqual(ACCESSORIES.map((item) => item.slug));
    const sources = ACCESSORY_PHOTOS.map((photo) => photo.creditUrl);
    expect(new Set(sources).size).toBe(ACCESSORIES.length);
    const teaSources = new Set(TEA_PHOTOS.map((photo) => photo.creditUrl));
    for (const photo of ACCESSORY_PHOTOS) {
      expect(teaSources.has(photo.creditUrl), photo.slug).toBe(false);
      expect(photo.creditUrl.startsWith('https://www.pexels.com/') || photo.creditUrl.startsWith('https://unsplash.com/')).toBe(true);
      expect(photo.licenseUrl === 'https://www.pexels.com/license/' || photo.licenseUrl === 'https://unsplash.com/license').toBe(true);
      const markup = accessoryPhotoMarkup(photo.slug);
      expect(markup).toContain(`src="/bilder/zubehoer/${photo.slug}-320.webp"`);
      expect(markup).toContain('type="image/avif"');
      expect(markup).toContain('alt=""');
      expect(markup).toContain('loading="lazy"');
    }
  });

  it('legt kleine WebP- und AVIF-Dateien ab', () => {
    for (const photo of ACCESSORY_PHOTOS) {
      for (const file of ['320.webp', '640.webp', '320.avif', '640.avif']) {
        const path = `public/bilder/zubehoer/${photo.slug}-${file}`;
        expect(existsSync(path), path).toBe(true);
      }
    }
  });

  it('sammelt den Bildnachweis unter den Karten', () => {
    const html = accessoryCreditsHtml();
    expect(html).toContain('id="bildnachweis-zubehoer"');
    for (const photo of ACCESSORY_PHOTOS) {
      expect(html).toContain(photo.creditName);
      expect(html).toContain(photo.creditUrl);
      expect(html).toContain(photo.licenseUrl);
    }
    for (const rule of FORBIDDEN_COPY) {
      expect(html, rule.id).not.toMatch(rule.pattern);
    }
  });
});
