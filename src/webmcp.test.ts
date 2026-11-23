import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadPosts, visiblePosts } from './blog';
import { GUIDE_CATALOG } from './guide-catalog';
import { recommend } from './recommender';
import { teas } from './recommender';
import { findTeas, initWebMcp, preparationFor, searchGuides, WEBMCP_TOOLS } from './webmcp';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WebMCP', () => {
  it('führt dieselben Beiträge wie der Blog', () => {
    const posts = visiblePosts(loadPosts(resolve('content/blog')), false);
    expect(GUIDE_CATALOG.map((guide) => guide.slug).sort()).toEqual(posts.map((post) => post.slug).sort());
    for (const post of posts) {
      const guide = GUIDE_CATALOG.find((item) => item.slug === post.slug);
      expect(guide?.title).toBe(post.title);
      expect(guide?.description).toBe(post.description);
    }
    expect(readFileSync('src/webmcp.ts', 'utf8')).not.toContain('import.meta.glob');
  });

  it('nutzt dieselben Treffer wie Finden und die Zubereitung aus dem Datensatz', () => {
    const prefs = { occasions: ['fokus'] as const, tastes: ['malzig'] as const, caffeine: 'egal' as const };
    const fromPage = recommend({ ...prefs, occasions: [...prefs.occasions], tastes: [...prefs.tastes] });
    const fromTool = findTeas({ moment: ['fokus'], taste: ['malzig'], caffeine: 'egal' });
    expect(fromTool.teas.map((tea) => tea.name)).toEqual(fromPage.map((item) => item.tea.name));
    expect(fromTool.teas[0]?.url).toBe('https://teelotse.de/entdecken#tee-assam');
    expect(fromTool.teas[0]?.satz).toBe(fromPage[0]?.reason);

    const sencha = teas.find((tea) => tea.id === 'sencha');
    expect(preparationFor({ tea: 'Sencha' })).toMatchObject({
      gefunden: true,
      slug: 'sencha',
      temperature: sencha?.temperature,
      steepTime: sencha?.steepTime,
      amount: sencha?.amount,
    });
    expect(preparationFor({ tea: 'gibt-es-nicht' })).toMatchObject({ gefunden: false });

    const guides = searchGuides({ query: 'Wasserkocher' });
    expect(guides.treffer.some((item) => item.url.endsWith('/blog/wasserkocher-fuer-tee'))).toBe(true);
    expect(guides.treffer.every((item) => item.title && item.description && item.url.startsWith('https://teelotse.de/'))).toBe(true);
  });

  it('registriert nur lesende Werkzeuge und bleibt ohne Schnittstelle still', () => {
    expect(WEBMCP_TOOLS.map((tool) => tool.name)).toEqual(['tee_finden', 'zubereitung_abrufen', 'ratgeber_suchen']);
    for (const tool of WEBMCP_TOOLS) {
      expect(tool.description.length).toBeGreaterThan(40);
      expect(tool.annotations.readOnlyHint).toBe(true);
      expect(tool.inputSchema.type).toBe('object');
    }
    expect(() => initWebMcp()).not.toThrow();

    const names: string[] = [];
    vi.stubGlobal('navigator', {
      modelContext: {
        registerTool(tool: { name: string }) {
          names.push(tool.name);
          return Promise.resolve();
        },
      },
    });
    vi.stubGlobal('document', {
      modelContext: {
        registerTool() {
          throw new Error('document sollte nicht zuerst drankommen');
        },
      },
    });
    initWebMcp();
    expect(names).toEqual(['tee_finden', 'zubereitung_abrufen', 'ratgeber_suchen']);
  });
});
