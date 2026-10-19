/** Ruhige Strichzeichnung je Teeart. Eine Farbe, gleiche Strichstärke. */
const DRAWING: Record<string, string> = {
  Schwarztee:
    '<path d="M18 58c10-8 16-8 28 0"/><path d="M28 56c3-18 8-30 20-38"/><path d="M34 40c8-2 14 3 16 12"/>',
  Grüntee:
    '<path d="M22 62c18-28 28-40 48-48-8 22-20 36-48 48z"/><path d="M30 54c12-8 22-18 30-32"/>',
  Weißtee:
    '<path d="M40 64c2-20 6-34 8-48"/><path d="M40 40c8-6 14-8 22-6"/><path d="M40 50c-8-4-14-4-20 0"/>',
  Oolong:
    '<path d="M24 58c8-16 18-22 34-18 4 10-2 20-14 26-12 4-18 0-20-8z"/><path d="M36 48c6 2 12 8 14 16"/>',
  'Pu-Erh':
    '<path d="M20 46h40"/><path d="M24 46c0 14 8 22 16 22s16-8 16-22"/><path d="M30 34c4 4 16 4 20 0"/>',
  Kräutertee:
    '<path d="M28 64c8-16 8-28 2-42"/><path d="M30 48c10-4 16-2 22 4"/><path d="M30 36c8-8 16-10 24-6"/>',
  Rooibos:
    '<path d="M40 66V22"/><path d="M40 30c-8 4-14 12-14 12"/><path d="M40 38c8 2 14 10 14 10"/><path d="M40 48c-7 3-12 10-12 10"/><path d="M40 54c7 2 12 8 12 8"/>',
  Früchtetee:
    '<circle cx="34" cy="42" r="12"/><circle cx="50" cy="48" r="10"/><path d="M42 30c2-6 8-8 12-6"/>',
  Mate:
    '<path d="M30 28h16v6c8 2 14 8 14 16 0 10-8 16-20 16s-20-8-18-18c1-6 6-10 8-20z"/><path d="M46 30c6-2 10 2 10 8"/>',
};

export function teaVisual(type: string): string {
  const body = DRAWING[type] ?? DRAWING.Schwarztee;
  return `<svg viewBox="0 0 80 80" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
