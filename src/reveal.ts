/** Einzelne Blöcke blenden beim Scrollen ein. Ohne Skript und bei reduzierter Bewegung bleibt alles sichtbar. */
const STAGGER_MS = 70;

const SELECTOR = [
  'h2',
  'h3',
  '.area-lead',
  '.soon',
  '.tea-card',
  '.blog-card',
  '.post-figure',
  '.prose > p',
  '.prose > ul > li',
  '.prose > ol > li',
  '.prose > figure',
  '.prose > address',
  '#finden .chip-grid:not(.chip-grid-taste) > .chip',
].join(',');

export function initReveal(): void {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const main = document.querySelector('main');
  if (!main) return;

  const nodes = [...main.querySelectorAll<HTMLElement>(SELECTOR)].filter((el) => keep(el));
  const units = nodes.filter((el) => !nodes.some((other) => other !== el && el.contains(other)));
  const below = window.innerHeight - 32;
  const pending = units.filter((el) => el.getBoundingClientRect().top >= below);
  if (pending.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const hit = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target as HTMLElement)
        .sort(byDocumentOrder);
      hit.forEach((el, index) => {
        el.style.setProperty('--reveal-delay', `${Math.min(index, 8) * STAGGER_MS}ms`);
        el.classList.add('is-in');
        observer.unobserve(el);
        el.addEventListener('transitionend', (event) => {
          if (event.target !== el || event.propertyName !== 'opacity') return;
          el.classList.remove('will-reveal', 'is-in');
          el.style.removeProperty('--reveal-delay');
        });
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
  );

  for (const el of pending) {
    el.classList.add('will-reveal');
    observer.observe(el);
  }
}

function keep(el: HTMLElement): boolean {
  if (el.closest('.hero, .site-head, .footer')) return false;
  if (el.closest('[hidden]')) return false;
  const card = el.closest('.tea-card, .blog-card');
  return !card || card === el;
}

function byDocumentOrder(a: Node, b: Node): number {
  if (a === b) return 0;
  const pos = a.compareDocumentPosition(b);
  if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}
