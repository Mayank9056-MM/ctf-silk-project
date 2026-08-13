/**
 * Shared pill-badge styling, same "compose color strings, apply via cn()
 * at the call site" pattern as dashboard-button.ts. Replaces bare
 * colored text (announcement priority, leaderboard scope, frozen rank)
 * with an actual pill — a plain colored word next to plain body text
 * doesn't read as a status indicator; a pill does.
 */
export const srBadgeBase =
  "inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[8.5px] font-semibold tracking-[0.1em] uppercase";

export const srBadgeCrimson = "bg-(--sr-crimson-hot)/12 text-(--sr-crimson-hot) ring-1 ring-(--sr-crimson-hot)/25";
export const srBadgeTeal = "bg-(--sr-teal-hot)/12 text-(--sr-teal-hot) ring-1 ring-(--sr-teal-hot)/25";
export const srBadgeGold = "bg-(--sr-gold)/12 text-(--sr-gold) ring-1 ring-(--sr-gold)/25";
export const srBadgeSteel = "bg-(--sr-steel)/12 text-(--sr-steel) ring-1 ring-(--sr-steel)/25";