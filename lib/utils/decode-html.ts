/**
 * Decode HTML entities in text
 * Handles common entities like &amp;, &#8217; (smart quotes), &#215; (×), etc.
 */
export function decodeHTML(text: string | null | undefined): string {
  if (!text) return '';
  
  // Create a temporary element to leverage browser's HTML entity decoding
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }
  
  // Server-side fallback: manually decode common entities
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "\u2019") // Right single quotation mark (')
    .replace(/&#8216;/g, "\u2018") // Left single quotation mark (')
    .replace(/&#8220;/g, "\u201C") // Left double quotation mark (")
    .replace(/&#8221;/g, "\u201D") // Right double quotation mark (")
    .replace(/&#215;/g, "\u00D7")  // Multiplication sign (×)
    .replace(/&#8211;/g, "\u2013") // En dash (–)
    .replace(/&#8212;/g, "\u2014") // Em dash (—)
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec)); // Numeric entities
}
