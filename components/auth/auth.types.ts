// components/auth/auth.types.ts

/** A single metadata row in the auth narrative panel — e.g. "Case Status: Active". */
export interface AuthNarrativeStatus {
  label: string;
  value: string;
  /** Shows the pulsing HUD dot next to the value (used for the "Connected" row). */
  pulse?: boolean;
}