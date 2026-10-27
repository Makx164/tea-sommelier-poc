import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FORBIDDEN_COPY } from './copy-guard';
import { teas } from './recommender';
import { photoCreditsHtml, photoFor, TEA_PHOTOS, teaPhotoMarkup } from './tea-photos';

describe('Teebilder', () => {
  it('hat je Teeart ein Foto und eigene Bilder für Matcha und Pfefferminze', () => {
    const types = new Set(teas.map((tea) => tea.type));
    expect([...types].sort()).toEqual([
      'Früchtetee',
      'Grüntee',
      'Kräutertee',
      'Mate',
      'Oolong',
      'Pu-Erh',
      'Rooibos',
      'Schwarztee',
      'Weißtee',
    ]);
    for (const tea of teas) {
      const photo = photoFor(tea);
      expect(photo.key.length).toBeGreaterThan(0);
      const markup = teaPhotoMarkup(tea);
      expect(markup).toContain(`src="/bilder/tees/${photo.key}-320.webp"`);
      expect(markup).toContain('loading="lazy"');
      expect(markup).toContain('type="image/avif"');
      expect(markup).toContain('alt=""');
    }
    expect(photoFor({ id: 'sencha', type: 'Grüntee' }).key).toBe('gruentee');
    expect(photoFor({ id: 'matcha', type: 'Grüntee' }).key).toBe('matcha');
    expect(photoFor({ id: 'kamille', type: 'Kräutertee' }).key).toBe('kraeutertee');
    expect(photoFor({ id: 'pfefferminze', type: 'Kräutertee' }).key).toBe('pfefferminze');
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
    }
    for (const rule of FORBIDDEN_COPY) {
      expect(html, rule.id).not.toMatch(rule.pattern);
    }
  });
});
