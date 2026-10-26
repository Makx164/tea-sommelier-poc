import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { applyBrandHtml } from './brand-html';
import { loadPosts, type Post } from './blog';
import {
  injectHome,
  renderArticleDocument,
  renderLlms,
  renderRobots,
  renderSectionDocument,
  renderSitemap,
  sitemapPaths,
  type SectionId,
} from './site-html';

const SECTIONS: readonly SectionId[] = ['finden', 'entdecken', 'create', 'zubehoer', 'blog'];

const CLEAN: Record<string, string> = {
  '/finden': '/finden.html',
  '/entdecken': '/entdecken.html',
  '/create': '/create.html',
  '/zubehoer': '/zubehoer.html',
  '/blog': '/blog.html',
  '/sitemap.xml': '/sitemap.xml',
  '/robots.txt': '/robots.txt',
  '/llms.txt': '/llms.txt',
};

function draftsInThisBuild(): boolean {
  return process.env.VERCEL_ENV === 'preview';
}

function normalize(url: string): string {
  const path = url.split('?')[0] ?? '';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

export function sitePages(): Plugin {
  let serve = false;
  const postsDir = resolve(process.cwd(), 'content/blog');
  const indexPath = resolve(process.cwd(), 'index.html');
  const source = (): string => readFileSync(indexPath, 'utf8');
  const posts = (): Post[] => loadPosts(postsDir);

  return {
    name: 'site-pages',
    configResolved(config) {
      serve = config.command === 'serve';
    },
    transformIndexHtml(html) {
      if (!html.includes('<!-- blog:list -->')) return html;
      const includeDrafts = serve || draftsInThisBuild();
      return injectHome(html, posts(), includeDrafts);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = normalize(req.url ?? '');
        const body = routeBody(path, source(), posts(), true, '/src/style.css', '/src/main.ts');
        if (!body) return next();
        res.statusCode = 200;
        res.setHeader('Content-Type', body.type);
        res.end(body.type.startsWith('text/html') ? applyBrandHtml(body.text) : body.text);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? '';
        const path = normalize(url);
        const query = url.includes('?') ? url.slice(url.indexOf('?')) : '';
        const mapped = CLEAN[path] ?? blogFile(path);
        if (mapped) req.url = `${mapped}${query}`;
        next();
      });
    },
    generateBundle(_options, bundle) {
      const includeDrafts = draftsInThisBuild();
      const allPosts = posts();
      const css = Object.keys(bundle).find((name) => name.endsWith('.css'));
      const entry = Object.entries(bundle).find(([, item]) => {
        return (
          item.type === 'chunk' &&
          item.isEntry &&
          item.facadeModuleId?.replaceAll('\\', '/').endsWith('/index.html')
        );
      });
      if (!css || !entry) this.error('Stil oder Skript fehlt im Build.');
      const styleHref = `/${css}`;
      const scriptHref = `/${entry[0]}`;
      const html = source();
      for (const section of SECTIONS) {
        this.emitFile({
          type: 'asset',
          fileName: section === 'blog' ? 'blog.html' : `${section}.html`,
          source: applyBrandHtml(
            renderSectionDocument({
              sourceHtml: html,
              section,
              posts: allPosts,
              includeDrafts,
              styleHref,
              scriptHref,
            }),
          ),
        });
      }
      for (const post of allPosts) {
        if (post.draft && !includeDrafts) continue;
        this.emitFile({
          type: 'asset',
          fileName: `blog/${post.slug}.html`,
          source: applyBrandHtml(
            renderArticleDocument({
              sourceHtml: html,
              post,
              styleHref,
              scriptHref,
            }),
          ),
        });
      }
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: renderSitemap(sitemapPaths(allPosts)),
      });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: renderRobots() });
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: renderLlms(allPosts) });
    },
  };
}

function blogFile(path: string): string | null {
  const match = path.match(/^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  return match?.[1] ? `/blog/${match[1]}.html` : null;
}

function routeBody(
  path: string,
  html: string,
  allPosts: Post[],
  includeDrafts: boolean,
  styleHref: string,
  scriptHref: string,
): { type: string; text: string } | null {
  if (path === '/sitemap.xml') {
    return { type: 'application/xml; charset=utf-8', text: renderSitemap(sitemapPaths(allPosts)) };
  }
  if (path === '/robots.txt') return { type: 'text/plain; charset=utf-8', text: renderRobots() };
  if (path === '/llms.txt') return { type: 'text/plain; charset=utf-8', text: renderLlms(allPosts) };
  const section = SECTIONS.find((item) => `/${item}` === path);
  if (section) {
    return {
      type: 'text/html; charset=utf-8',
      text: renderSectionDocument({
        sourceHtml: html,
        section,
        posts: allPosts,
        includeDrafts,
        styleHref,
        scriptHref,
      }),
    };
  }
  const slug = path.match(/^\/blog\/([a-z0-9]+(?:-[a-z0-9]+)*)$/)?.[1];
  if (!slug) return null;
  const post = allPosts.find((item) => item.slug === slug);
  if (!post || (post.draft && !includeDrafts)) return null;
  return {
    type: 'text/html; charset=utf-8',
    text: renderArticleDocument({ sourceHtml: html, post, styleHref, scriptHref }),
  };
}
