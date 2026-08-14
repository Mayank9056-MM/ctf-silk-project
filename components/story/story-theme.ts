/**
 * Story-specific semantic tokens, layered on top of the SAME --sr-*
 * custom properties dashboard-theme.ts already established (bg-void/
 * elevated/surface, crimson(-hot), teal(-hot), gold, text-*, border-*).
 * Nothing here redefines those — it only adds the two tokens the story
 * palette needs that the dashboard never did: a cold, desaturated
 * "investigation blue" distinct from --sr-blue's brighter link-blue.
 */
export const storyTheme = {
  background: {
    void: "bg-(--sr-bg-void)",
    elevated: "bg-(--sr-bg-elevated)",
    surface: "bg-(--sr-bg-surface)",
  },
  text: {
    primary: "text-(--sr-text-primary)",
    secondary: "text-(--sr-text-secondary)",
    muted: "text-(--sr-text-muted)",
  },
  accent: {
    crimson: "text-(--sr-crimson-hot)",
    investigation: "text-(--sr-investigation-blue)",
    investigationDim: "text-(--sr-investigation-blue-dim)",
  },
  border: {
    subtle: "border-(--sr-border-subtle)",
    normal: "border-(--sr-border-normal)",
  },
  font: {
    display: "sr-font-display",
    ui: "sr-font-ui",
    body: "sr-font-body",
    mono: "sr-font-mono",
  },
} as const;