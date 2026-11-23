/** Kopfzeile bleibt stehen und wird nach dem Scrollen kompakter. */
export function initHeader(): void {
  const head = document.querySelector<HTMLElement>('.site-head');
  if (!head) return;
  const onScroll = (): void => {
    head.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
