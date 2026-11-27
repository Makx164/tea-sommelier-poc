import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Vercel-Auslieferung', () => {
  it('verhandelt Markdown über Routen und ohne Middleware-Datei', () => {
    expect(existsSync('middleware.ts')).toBe(false);
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      cleanUrls?: boolean;
      routes: { src?: string; dest?: string; status?: number; handle?: string; headers?: Record<string, string> }[];
    };
    expect(config.cleanUrls).toBeUndefined();
    expect(config.routes.some((route) => route.handle === 'filesystem')).toBe(true);
    expect(config.routes.some((route) => route.dest === '/agent-md/index.md')).toBe(true);
    expect(config.routes.some((route) => route.dest === '/agent-md/$1.md')).toBe(true);
    expect(config.routes.some((route) => route.status === 404 && route.dest === '/agent-md/404.md')).toBe(true);
    expect(config.routes.some((route) => route.dest === '/$1.html')).toBe(true);
    expect(JSON.stringify(config.routes)).toContain('text/markdown');
    expect(JSON.stringify(config.routes)).toContain('"Vary":"Accept"');
  });
});
