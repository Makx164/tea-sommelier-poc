/** Bereiche blenden kurz ein. Ohne Skript und bei reduzierter Bewegung bleibt alles sichtbar. */
export function initReveal(): void {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const nodes = document.querySelectorAll<HTMLElement>('.area');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12 },
  );
  for (const node of nodes) {
    if (node.getBoundingClientRect().top < window.innerHeight * 0.92) continue;
    node.classList.add('will-reveal');
    observer.observe(node);
  }
}
