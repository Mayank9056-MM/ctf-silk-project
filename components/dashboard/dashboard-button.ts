/**
 * components/dashboard/dashboard-button.ts
 *
 * shadcn's buttonVariants() derives its colors from --primary/--accent/
 * --background, which are still the LIGHT shadcn defaults in :root
 * (app/globals.css) — this app's dark look comes entirely from the
 * separate sr-* token set applied manually, not from a .dark wrapper
 * around the dashboard tree. Any button using a shadcn color variant
 * ("ghost", "outline", the default solid) without an explicit sr-token
 * override therefore renders in the wrong palette: invisible ghost
 * buttons, near-white outline buttons, dark-on-dark icon buttons.
 *
 * The hero CTA (investigation-action.tsx) never had this problem
 * because it already overrides bg/text explicitly — these three
 * strings do the same for every other action button in the dashboard.
 * Only color changes; size/padding/radius/focus-ring still come from
 * buttonVariants({ size }).
 */
export const srButtonGhost =
  "bg-transparent text-(--sr-text-secondary) hover:bg-(--sr-bg-surface-strong) hover:text-(--sr-text-primary)";

export const srButtonOutline =
  "border border-(--sr-border-normal) bg-transparent text-(--sr-text-secondary) hover:border-(--sr-crimson-hot)/60 hover:text-(--sr-text-primary)";

export const srButtonIconGhost =
  "bg-transparent text-(--sr-text-secondary) hover:bg-(--sr-bg-surface-strong) hover:text-(--sr-text-primary)";