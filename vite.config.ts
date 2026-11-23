/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';
import affiliateLinks from './src/affiliate.json';
import { applyBrandHtml } from './src/brand-html';
import { renderGoPage } from './src/go-page';
import { sitePages } from './src/site-plugin';

const root = import.meta.dirname;
const shopBySlug = affiliateLinks as Record<string, string>;

function brandMarkup(): Plugin {
  return {
    name: 'brand-markup',
    transformIndexHtml(html) {
      return applyBrandHtml(html);
    },
  };
}

function goPages(): Plugin {
  return {
    name: 'go-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const slug = slugFrom(req.url ?? '');
        const shopUrl = slug ? shopBySlug[slug] : undefined;
        if (!slug || !shopUrl) return next();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(renderGoPage({ slug, shopUrl, scriptSrc: '/src/go-redirect.ts' }));
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? '';
        const path = url.split('?')[0] ?? '';
        const match = path.match(/^\/go\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
        if (match?.[1]) {
          const query = url.includes('?') ? url.slice(url.indexOf('?')) : '';
          req.url = `/go/${match[1]}.html${query}`;
        }
        next();
      });
    },
    generateBundle(_options, bundle) {
      const entry = Object.entries(bundle).find(([, item]) => {
        return item.type === 'chunk' && item.isEntry && item.facadeModuleId?.replaceAll('\\', '/').endsWith('/src/go-redirect.ts');
      });
      if (!entry) this.error('Weiterleitungs-Skript fehlt im Build.');
      const scriptSrc = `/${entry![0]}`;
      for (const [slug, shopUrl] of Object.entries(shopBySlug)) {
        this.emitFile({
          type: 'asset',
          fileName: `go/${slug}.html`,
          source: renderGoPage({ slug, shopUrl, scriptSrc }),
        });
      }
    },
  };
}

function slugFrom(url: string): string | null {
  const path = url.split('?')[0] ?? '';
  const match = path.match(/^\/go\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\.html)?\/?$/);
  return match?.[1] ?? null;
}

export default defineConfig({
  base: '/',
  plugins: [brandMarkup(), sitePages(), goPages()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        impressum: resolve(root, 'impressum.html'),
        datenschutz: resolve(root, 'datenschutz.html'),
        kontakt: resolve(root, 'kontakt.html'),
        'go-redirect': resolve(root, 'src/go-redirect.ts'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
