import type { Occasion } from './types';

function icon(body: string): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

/** Strichicons, eine Stärke, currentColor. Kein Herz, Schild, Kreuz oder Blitz. */
export const MOMENT_ICON: Record<Occasion, string> = {
  fokus: icon('<path d="M4 16.5h16"/><path d="M7 16.5a5 5 0 0 1 10 0"/>'),
  abend: icon('<path d="M14.8 5.8a6.4 6.4 0 1 0 1.2 12.2 5 5 0 0 1-1.2-12.2z"/>'),
  nach_essen: icon('<path d="M4.5 13h15"/><path d="M6.8 13c.5 3.4 2.6 5.4 5.2 5.4s4.7-2 5.2-5.4"/>'),
  aufwaermen: icon('<path d="M8 10h6.5v4.2a3.25 3.25 0 0 1-6.5 0V10z"/><path d="M14.5 11.2h1.3a2.1 2.1 0 0 1 0 4.2H14.5"/><path d="M10 7.2c.35.7.1 1.3-.15 1.8"/><path d="M12.4 6.4c.35.8.1 1.4-.15 2"/>'),
  erfrischen: icon('<path d="M12 19.2C8 16.8 6 13.8 6 10.8 6 7.6 8.4 5.2 12 5.2s6 2.4 6 5.6c0 3-2 6-6 8.4z"/><path d="M12 19.2V8.2"/>'),
  suesses: icon('<path d="M12 7.4c1.5 1.7 3 3.2 3 5.4a3 3 0 1 1-6 0c0-2.2 1.5-3.7 3-5.4z"/><path d="M12 7.2c.4-1.3 1.3-2.1 2.4-2.3"/>'),
};
