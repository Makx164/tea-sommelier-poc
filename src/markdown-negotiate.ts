export const MARKDOWN_TYPE = 'text/markdown; charset=utf-8';

export function wantsMarkdown(accept: string | null | undefined): boolean {
  if (!accept) return false;
  return accept.split(',').some((part) => {
    const [type, ...params] = part.trim().toLowerCase().split(';');
    if (type?.trim() !== 'text/markdown') return false;
    const quality = params.map((item) => item.trim()).find((item) => item.startsWith('q='));
    if (!quality) return true;
    const value = Number(quality.slice(2));
    return Number.isFinite(value) && value > 0;
  });
}

export function notFoundMarkdown(): string {
  return `# Seite nicht gefunden

Diese Adresse gibt es auf Teelotse nicht. Die Sitemap listet die vorhandenen Seiten. Ein Überblick für Assistenten steht in llms.txt.

- [Sitemap](/sitemap.xml)
- [Überblick für Assistenten](/llms.txt)
`;
}
