/** Presentational-only fallback — DashboardInvestigationDTO carries no human chapter/scene title (see Phase 1 report), so this reformats the slug the backend already gave us rather than inventing copy. */
export function prettifySlug(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}