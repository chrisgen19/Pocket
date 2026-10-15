/**
 * Stable hue (0-359) for a domain, so a save without an image always gets the same
 * typographic cover color. The tone comes from the --cover-* tokens.
 */
export const coverHue = (domain: string): number => {
  let hash = 0;
  for (const char of domain) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash) % 360;
};
