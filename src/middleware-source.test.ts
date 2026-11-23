import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Vercel-Middleware', () => {
  it('importiert kein Node-Dateisystem und nicht den Seitengenerator', () => {
    const source = readFileSync('middleware.ts', 'utf8');
    expect(source).toContain("from './src/markdown-negotiate'");
    expect(source).not.toContain('markdown-pages');
    expect(source).not.toContain('node:fs');
    expect(source).not.toContain('node:path');
    expect(source).not.toContain("runtime: 'nodejs'");
    expect(source).toContain('text/markdown; charset=utf-8');
    expect(source).toContain('Vary');
  });
});
