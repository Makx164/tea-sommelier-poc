/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const repoRoot = import.meta.dirname;
const siteRoot = resolve(repoRoot, 'site');

export default defineConfig({
  root: siteRoot,
  base: '/',
  build: {
    outDir: resolve(repoRoot, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(siteRoot, 'index.html'),
        impressum: resolve(siteRoot, 'impressum.html'),
        datenschutz: resolve(siteRoot, 'datenschutz.html'),
      },
    },
  },
  test: {
    root: repoRoot,
    environment: 'node',
    include: ['site/src/**/*.test.ts'],
  },
});
