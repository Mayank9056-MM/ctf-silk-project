import { Flag, ShieldAlert, Lightbulb, Users, Trophy, Ban } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Placeholder rule copy — nothing in the provided files states the
 * event's actual official rules, so these are generic, safe CTF
 * conventions the schema itself already confirms exist (Hint.xpCost,
 * Event.leaderboardFrozenAt, ChallengeAccessService's server-authoritative
 * design). Replace RULES below with the real rule text before launch.
 */
const RULES = [
  {
    icon: Flag,
    title: "Flag Format",
    description: "Flags follow the format CTF{...}. Submit exactly as found — case-sensitive, no alterations.",
  },
  {
    icon: ShieldAlert,
    title: "Fair Play",
    description:
      "No attacking platform infrastructure, other investigators, or brute-forcing outside a challenge's intended scope.",
  },
  {
    icon: Lightbulb,
    title: "Hints Cost XP",
    description: "Hints are available for every challenge but deduct XP from your total when unlocked.",
  },
  {
    icon: Users,
    title: "Individual Investigation",
    description: "Play under your own account. Sharing flags or accounts between investigators is prohibited.",
  },
  {
    icon: Trophy,
    title: "Standings Freeze",
    description: "The leaderboard freezes near the end of the event — your final placement locks at that point.",
  },
  {
    icon: Ban,
    title: "Report, Don't Exploit",
    description: "Found a platform bug outside a challenge? Report it privately instead of exploiting it for XP.",
  },
] as const;

export function LandingRules() {
  return (
    <section>
      <h2 className="sr-landing-anim-rules-title sr-eyebrow sr-eyebrow-accent" style={{ marginBottom: 6 }}>
        Case Briefing — Rules of Engagement
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {RULES.map((rule) => (
          <div key={rule.title} className={cn("sr-landing-anim-rule sr-panel")} style={{ padding: "18px 20px" }}>
            <div className="flex items-start gap-3">
              <span className="sr-landing-rule-icon" aria-hidden="true">
                <rule.icon size={15} />
              </span>
              <div>
                <p className="sr-panel-title" style={{ margin: "0 0 6px", border: "none", padding: 0, fontSize: 12.5 }}>
                  {rule.title}
                </p>
                <p style={{ fontSize: 12.5, color: "var(--sr-dim)", lineHeight: 1.6, margin: 0 }}>{rule.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}