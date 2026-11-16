/**
 * Convert ISO 8601 durations (as found in schema.org recipe markup, e.g. "PT1H30M")
 * into human-readable text ("1 hr 30 min"). Non-ISO strings are returned unchanged
 * so values like "15 mins" or "10-12 hours" pass through untouched.
 */
export function formatDuration(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i
  );
  if (!match || trimmed.toUpperCase() === 'P' || trimmed.toUpperCase() === 'PT') {
    return trimmed;
  }

  const [, d, h, m, s] = match;
  const totalMinutes = Math.round(
    parseFloat(d || '0') * 24 * 60 +
      parseFloat(h || '0') * 60 +
      parseFloat(m || '0') +
      parseFloat(s || '0') / 60
  );

  if (totalMinutes <= 0) return null;

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} min`;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}
