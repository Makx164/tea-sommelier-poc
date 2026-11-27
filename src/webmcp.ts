import { GUIDE_CATALOG } from './guide-catalog';
import { recommend, teas } from './recommender';
import { SITE } from './site-origin';
import {
  CAFFEINE_CHOICES,
  OCCASIONS,
  OCCASION_LABEL,
  TASTES,
  TASTE_LABEL,
  type CaffeineChoice,
  type Occasion,
  type Taste,
} from './types';

type ModelContextLike = {
  registerTool: (tool: unknown, options?: unknown) => unknown;
};

function guides(): readonly { slug: string; title: string; description: string }[] {
  return GUIDE_CATALOG;
}

function teaUrl(id: string): string {
  return `${SITE}/entdecken#tee-${id}`;
}

function asStrings(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function occasionFrom(value: string): Occasion | null {
  const key = value.trim().toLocaleLowerCase('de-DE');
  if ((OCCASIONS as readonly string[]).includes(key)) return key as Occasion;
  const byLabel = (Object.entries(OCCASION_LABEL) as [Occasion, string][]).find(
    ([, label]) => label.toLocaleLowerCase('de-DE') === key,
  );
  return byLabel?.[0] ?? null;
}

function tasteFrom(value: string): Taste | null {
  const key = value.trim().toLocaleLowerCase('de-DE');
  if ((TASTES as readonly string[]).includes(key)) return key as Taste;
  const byLabel = (Object.entries(TASTE_LABEL) as [Taste, string][]).find(
    ([, label]) => label.toLocaleLowerCase('de-DE') === key,
  );
  return byLabel?.[0] ?? null;
}

function caffeineFrom(value: unknown): CaffeineChoice | null {
  if (value === undefined || value === null || value === '') return 'egal';
  if (typeof value !== 'string') return null;
  const key = value.trim().toLocaleLowerCase('de-DE');
  if ((CAFFEINE_CHOICES as readonly string[]).includes(key)) return key as CaffeineChoice;
  if (key === 'mit koffein') return 'ja';
  if (key === 'ohne koffein') return 'nein';
  if (key === 'koffein egal') return 'egal';
  return null;
}

export function findTeas(input: unknown): { teas: { name: string; url: string; satz: string }[]; hinweis?: string } {
  const record = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const moments = asStrings(record.moment).map(occasionFrom);
  if (moments.some((item) => item === null) || moments.length === 0) {
    return {
      teas: [],
      hinweis: `Mindestens ein Moment: ${OCCASIONS.map((item) => OCCASION_LABEL[item]).join(', ')}.`,
    };
  }
  const tastes = asStrings(record.taste).map(tasteFrom);
  if (tastes.some((item) => item === null)) {
    return {
      teas: [],
      hinweis: `Geschmack, falls gesetzt: ${TASTES.map((item) => TASTE_LABEL[item]).join(', ')}.`,
    };
  }
  const caffeine = caffeineFrom(record.caffeine);
  if (!caffeine) return { teas: [], hinweis: 'Koffein: ja, nein oder egal.' };
  const picks = recommend({
    occasions: moments as Occasion[],
    tastes: tastes as Taste[],
    caffeine,
  });
  return {
    teas: picks.map((item) => ({
      name: item.tea.name,
      url: teaUrl(item.tea.id),
      satz: item.reason,
    })),
  };
}

export function preparationFor(input: unknown): Record<string, unknown> {
  const record = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const query = typeof record.tea === 'string' ? record.tea.trim() : '';
  if (!query) return { gefunden: false, hinweis: 'Name oder Kurzform der Sorte fehlt.' };
  const key = query.toLocaleLowerCase('de-DE');
  const tea = teas.find((item) => item.id === key || item.name.toLocaleLowerCase('de-DE') === key);
  if (!tea) return { gefunden: false, hinweis: 'Diesen Tee gibt es im Datensatz nicht.' };
  return {
    gefunden: true,
    name: tea.name,
    slug: tea.id,
    url: teaUrl(tea.id),
    temperature: tea.temperature,
    steepTime: tea.steepTime,
    amount: tea.amount,
  };
}

export function searchGuides(input: unknown): { treffer: { title: string; url: string; description: string }[]; hinweis?: string } {
  const record = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const query = typeof record.query === 'string' ? record.query.trim() : '';
  const terms = query
    .toLocaleLowerCase('de-DE')
    .split(/\s+/)
    .filter((term) => term.length > 1);
  if (terms.length === 0) return { treffer: [], hinweis: 'Suchwort fehlt.' };
  const treffer = guides()
    .filter((guide) => {
      const hay = `${guide.title} ${guide.description} ${guide.slug}`.toLocaleLowerCase('de-DE');
      return terms.every((term) => hay.includes(term));
    })
    .map((guide) => ({
      title: guide.title,
      url: `${SITE}/blog/${guide.slug}`,
      description: guide.description,
    }));
  return { treffer };
}

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

export const WEBMCP_TOOLS = [
  {
    name: 'tee_finden',
    title: 'Tee finden',
    description:
      'Schlägt ein bis drei Tees vor, mit Namen und Adresse. Dieselbe Auswahl wie auf der Seite Finden: Moment, optional Geschmack, Koffein. Nur Lesen, nichts wird gespeichert, kein Konto. Keine Beratung zu Gesundheit und keine Heilaussagen.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        moment: {
          type: 'array',
          description: 'Gewählter Moment. Mehrere sind erlaubt. Mindestens einer.',
          items: { type: 'string', enum: [...OCCASIONS] },
        },
        taste: {
          type: 'array',
          description: 'Geschmack. Kann leer bleiben.',
          items: { type: 'string', enum: [...TASTES] },
        },
        caffeine: {
          type: 'string',
          description: 'Koffein-Auswahl. Ohne Angabe gilt egal.',
          enum: [...CAFFEINE_CHOICES],
          default: 'egal',
        },
      },
      required: ['moment'],
    },
    annotations: READ_ONLY,
    execute: (input: unknown) => findTeas(input),
  },
  {
    name: 'zubereitung_abrufen',
    title: 'Zubereitung abrufen',
    description:
      'Gibt Temperatur, Ziehzeit und Menge einer Sorte aus dem Datensatz zurück. Eingabe ist der Name oder die Kurzform. Nur Lesen, nichts wird gespeichert, kein Konto. Keine Beratung zu Gesundheit und keine Heilaussagen.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        tea: {
          type: 'string',
          description: 'Name oder Kurzform der Sorte.',
        },
      },
      required: ['tea'],
    },
    annotations: READ_ONLY,
    execute: (input: unknown) => preparationFor(input),
  },
  {
    name: 'ratgeber_suchen',
    title: 'Ratgeber suchen',
    description:
      'Sucht veröffentlichte Blogbeiträge und Kaufratgeber nach Titel und Kurzbeschreibung. Liefert Titel, Adresse und Kurzbeschreibung. Nur Lesen, nichts wird gespeichert, kein Konto. Keine Beratung zu Gesundheit und keine Heilaussagen.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: {
          type: 'string',
          description: 'Suchwort aus Titel oder Kurzbeschreibung.',
        },
      },
      required: ['query'],
    },
    annotations: READ_ONLY,
    execute: (input: unknown) => searchGuides(input),
  },
] as const;

function modelContext(): ModelContextLike | null {
  const scopes: unknown[] = [];
  if (typeof navigator !== 'undefined') scopes.push(navigator);
  if (typeof document !== 'undefined') scopes.push(document);
  for (const scope of scopes) {
    const ctx = (scope as { modelContext?: ModelContextLike } | null)?.modelContext;
    if (ctx && typeof ctx.registerTool === 'function') return ctx;
  }
  return null;
}

/** Registriert die lesenden Werkzeuge, wenn der Browser die Schnittstelle hat. */
export function initWebMcp(): void {
  const ctx = modelContext();
  if (!ctx) return;
  for (const tool of WEBMCP_TOOLS) {
    try {
      const pending = ctx.registerTool(tool);
      if (pending && typeof (pending as Promise<unknown>).then === 'function') {
        void (pending as Promise<unknown>).catch(() => {});
      }
    } catch {
      // Browser ohne passende Signatur bleiben still.
    }
  }
}
