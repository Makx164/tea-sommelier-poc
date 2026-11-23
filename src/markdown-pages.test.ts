import { describe, expect, it } from 'vitest';
import { FORBIDDEN_COPY } from './copy-guard';
import {
  isPageLike,
  markdownFor,
  negotiate,
  notFoundMarkdown,
  wantsMarkdown,
} from './markdown-pages';
import { teas } from './recommender';

describe('Markdown für Assistenten', () => {
  it('erkennt Accept und lässt /go sowie Dateien in Ruhe', () => {
    expect(wantsMarkdown('text/markdown')).toBe(true);
    expect(wantsMarkdown('text/markdown, text/html;q=0.5')).toBe(true);
    expect(wantsMarkdown('text/html')).toBe(false);
    expect(wantsMarkdown('text/markdown;q=0')).toBe(false);
    expect(wantsMarkdown(null)).toBe(false);
    expect(isPageLike('/')).toBe(true);
    expect(isPageLike('/blog/sencha')).toBe(true);
    expect(isPageLike('/go/sencha')).toBe(false);
    expect(isPageLike('/sitemap.xml')).toBe(false);
    expect(negotiate('/go/sencha', 'text/markdown')).toBeNull();
    expect(negotiate('/', 'text/html')).toBeNull();
  });

  it('liefert Startseite, Beitrag und 404 als Text', () => {
    const home = negotiate('/', 'Accept: text/markdown'.replace('Accept: ', ''));
    expect(home?.status).toBe(200);
    expect(home?.contentType).toBe('text/markdown; charset=utf-8');
    expect(home?.vary).toBe('Accept');
    expect(home?.body.trim().length).toBeGreaterThan(20);
    expect(home?.body).toContain('Find your moment.');
    expect(home!.body.indexOf('Find your moment.')).toBeLessThan(home!.body.indexOf('Find your taste.'));
    expect(home!.body.indexOf('Find your taste.')).toBeLessThan(home!.body.indexOf('Find your tea.'));

    const article = negotiate('/blog/tee-zubereiten', 'text/markdown');
    expect(article?.status).toBe(200);
    expect(article?.contentType).toBe('text/markdown; charset=utf-8');
    expect(article?.vary).toBe('Accept');
    expect(article?.body).toContain('Tee zubereiten');
    expect(article!.body.trim().length).toBeGreaterThan(40);

    const missing = negotiate('/gibt-es-nicht', 'text/markdown');
    expect(missing?.status).toBe(404);
    expect(missing?.contentType).toBe('text/markdown; charset=utf-8');
    expect(missing?.vary).toBe('Accept');
    expect(missing!.body.trim().length).toBeGreaterThanOrEqual(20);
    expect(missing?.body).toContain('/sitemap.xml');
    expect(missing?.body).toContain('/llms.txt');
    expect(notFoundMarkdown()).toBe(missing?.body);

    const about = markdownFor('/ueber-uns');
    const kontakt = markdownFor('/kontakt');
    expect(about).toContain('Illgnerstraße 35');
    expect(kontakt).toContain('maximilianhillert@mail.grokbot.com');
    const finden = markdownFor('/finden') ?? '';
    expect(finden).toContain(teas[0]?.temperature);
    expect(finden).not.toContain('teelotse-21');
    for (const body of [home!.body, article!.body, missing!.body, about ?? '', kontakt ?? '', finden]) {
      for (const rule of FORBIDDEN_COPY) {
        expect(body, rule.id).not.toMatch(rule.pattern);
      }
    }
  });
});
