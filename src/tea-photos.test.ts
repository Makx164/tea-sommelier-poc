import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FORBIDDEN_COPY } from './copy-guard';
import { teas } from './recommender';
import { photoCreditsHtml, photoFor, TEA_PHOTOS, teaPhotoMarkup } from './tea-photos';

describe('Teebilder', () => {
  it('gibt jedem Tee ein eigenes Foto', () => {
    expect(TEA_PHOTOS).toHaveLength(teas.length);
    const keys = TEA_PHOTOS.map((photo) => photo.key);
    expect(new Set(keys).size).toBe(teas.length);
    expect(keys).toEqual(teas.map((tea) => tea.id));
    const sources = new Set(TEA_PHOTOS.map((photo) => photo.creditUrl));
    expect(sources.size).toBe(teas.length);

    for (const tea of teas) {
      const photo = photoFor(tea);
      expect(photo.key).toBe(tea.id);
      const markup = teaPhotoMarkup(tea);
      expect(markup).toContain(`src="/bilder/tees/${tea.id}-320.webp"`);
      expect(markup).toContain('loading="lazy"');
      expect(markup).toContain('type="image/avif"');
      expect(markup).toContain('alt=""');
    }

    const blackTeas = ['assam', 'ceylon', 'darjeeling', 'lapsang-souchong', 'masala-chai'];
    const pictures = blackTeas.map((id) => photoFor({ id }).creditUrl);
    expect(new Set(pictures).size).toBe(blackTeas.length);
  });

  it('legt kleine WebP- und AVIF-Dateien ab', () => {
    for (const photo of TEA_PHOTOS) {
      for (const file of ['320.webp', '640.webp', '320.avif', '640.avif']) {
        const path = `public/bilder/tees/${photo.key}-${file}`;
        expect(existsSync(path), path).toBe(true);
      }
    }
  });

  it('sammelt den Bildnachweis ohne Wirkversprechen', () => {
    const html = photoCreditsHtml();
    expect(html).toContain('id="bildnachweis"');
    expect(html).toContain('https://www.pexels.com/license/');
    expect(html).toContain('https://unsplash.com/license');
    for (const photo of TEA_PHOTOS) {
      expect(html).toContain(photo.creditName);
      expect(html).toContain(photo.creditUrl);
      expect(photo.creditUrl.startsWith('https://www.pexels.com/') || photo.creditUrl.startsWith('https://unsplash.com/')).toBe(true);
    }
    for (const rule of FORBIDDEN_COPY) {
      expect(html, rule.id).not.toMatch(rule.pattern);
    }
  });
});
