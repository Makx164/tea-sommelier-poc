import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Veröffentlichung', () => {
  it('setzt den Basispfad auf die Domain-Wurzel', () => {
    const config = readFileSync('vite.config.ts', 'utf8');
    expect(config).toMatch(/base:\s*'\/'/);
  });

  it('legt die Domain in die CNAME-Quelle', () => {
    const lines = readFileSync('site/public/CNAME', 'utf8')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((line) => line.length > 0);
    expect(lines).toEqual(['tee.yoursidequest.org']);
  });

  it('behält .nojekyll und /legacy', () => {
    expect(existsSync('site/public/.nojekyll')).toBe(true);
    expect(existsSync('.nojekyll')).toBe(true);
    expect(existsSync('legacy/clickdummy/index.html')).toBe(true);
    expect(existsSync('legacy/webhook-formular.html')).toBe(true);
  });

  it('nennt den Stand live', () => {
    expect(readFileSync('README.md', 'utf8')).toContain('**Status: live**');
    expect(readFileSync('CHANGELOG.md', 'utf8')).toContain('## 2026-10-14 – v1.0');
    for (const file of ['site/index.html', 'site/impressum.html', 'site/datenschutz.html']) {
      expect(readFileSync(file, 'utf8'), file).not.toContain('nicht live');
    }
  });
});
