import { next } from '@vercel/functions';
import { notFoundMarkdown, wantsMarkdown } from './src/markdown-pages';

const TYPE = 'text/markdown; charset=utf-8';

function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname || '/';
}

function markdownAsset(path: string): string {
  if (path === '/') return '/agent-md/index.md';
  return `/agent-md${path}.md`;
}

function markdownResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': TYPE,
      Vary: 'Accept',
    },
  });
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = normalize(url.pathname);
  if (path.includes('.') || path.startsWith('/agent-md') || path.startsWith('/go')) {
    return next();
  }
  if (!wantsMarkdown(request.headers.get('accept'))) {
    return next({ headers: { Vary: 'Accept' } });
  }
  try {
    const upstream = await fetch(new URL(markdownAsset(path), url.origin), {
      headers: { accept: '*/*' },
      redirect: 'manual',
    });
    if (upstream.ok) {
      const body = await upstream.text();
      if (body.trim().length > 0 && !body.trimStart().startsWith('<')) {
        return markdownResponse(body, 200);
      }
    }
  } catch (error) {
    console.error('Markdown-Fassung nicht gelesen', error);
  }
  return markdownResponse(notFoundMarkdown(), 404);
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!agent-md/|assets/|bilder/|brand/|go/|favicon|src/|hero/).*)'],
};
