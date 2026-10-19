/** Sichtbare Formulierungen, die nicht auf der Seite stehen dürfen. */
export const FORBIDDEN_COPY: readonly { id: string; pattern: RegExp }[] = [
  { id: 'immun', pattern: /immun/i },
  { id: 'abwehr', pattern: /abwehr/i },
  { id: 'detox', pattern: /detox/i },
  { id: 'entgiften', pattern: /entgift/i },
  { id: 'bekoemmlich', pattern: /bek[oö]mmlich/i },
  { id: 'verdauungsfoerdernd', pattern: /verdauungsförder|verdauungsfoerder/i },
  { id: 'regeneration', pattern: /regeneration/i },
  { id: 'recovery', pattern: /\brecovery\b/i },
  { id: 'hydration', pattern: /hydration/i },
  { id: 'wohlbefinden', pattern: /wohlbefinden|wohlfühlen|wohlfuehlen/i },
  { id: 'beruhigend', pattern: /beruhig/i },
  { id: 'staerkend', pattern: /stärkend|staerkend|\bstärkt\b|\bstaerkt\b/i },
  { id: 'belebend', pattern: /belebend/i },
  { id: 'aktivierend', pattern: /aktivierend/i },
  { id: 'ausgleichend', pattern: /ausgleichend/i },
  { id: 'harmonisierend', pattern: /harmonisierend/i },
  { id: 'power', pattern: /\bpower\b/i },
  { id: 'boost', pattern: /\bboost\b/i },
  { id: 'energie', pattern: /\benergie\b/i },
  { id: 'hilft-bei', pattern: /hilft bei/i },
  { id: 'gegen', pattern: /\bgegen\b/i },
  { id: 'wirkt', pattern: /\bwirkt\b|\bwirkung\b/i },
  { id: 'frieden', pattern: /\bfrieden\b|\bpeace\b/i },
  { id: 'magen', pattern: /\bmagen\b/i },
  { id: 'bauch', pattern: /\bbauch\b/i },
  { id: 'verdauung', pattern: /verdau/i },
  { id: 'nerven', pattern: /\bnerven\b/i },
  { id: 'schlaf', pattern: /schlaf/i },
  { id: 'vitamine', pattern: /vitamin/i },
  { id: 'antioxidantien', pattern: /antioxidant/i },
  { id: 'traditionell-bei', pattern: /traditionell bei/i },
  { id: 'schwanger-kategorie', pattern: /für schwangere|fuer schwangere|schwangere kaufen|für kinder|fuer kinder/i },
  { id: 'ki', pattern: /\bKI\b/ },
  { id: 'ai', pattern: /\bAI\b/ },
  { id: 'heilt', pattern: /\bheilt\b|heilmittel|heilung/i },
  { id: 'symptom', pattern: /symptom/i },
  { id: 'medizin', pattern: /medizin|krankheit/i },
  { id: 'entspannend', pattern: /entspann/i },
  { id: 'wach-machend', pattern: /wach machend|macht wach/i },
];

export function visibleTextFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
