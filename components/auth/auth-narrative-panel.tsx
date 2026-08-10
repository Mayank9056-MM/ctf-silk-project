interface AuthNarrativeStatus {
  label: string;
  value: string;
  pulse?: boolean;
}

interface AuthNarrativePanelProps {
  eyebrow: string;
  title: string;
  description: string;
  statuses: AuthNarrativeStatus[];
}

/**
 * Left column of the split (registration) layout. Deliberately sparse —
 * one title, one sentence, a hairline divider, and a short status list.
 * No card chrome: it's meant to read as ambient scene-setting next to
 * the actual interactive panel, not a second boxed component.
 */
export function AuthNarrativePanel({
  eyebrow,
  title,
  description,
  statuses,
}: AuthNarrativePanelProps) {
  return (
    <div className="sr-narrative">
      <span className="sr-eyebrow sr-eyebrow-accent">{eyebrow}</span>
      <h1 className="sr-narrative-title">{title}</h1>
      <p className="sr-narrative-desc">{description}</p>
      <div className="sr-narrative-divider" aria-hidden="true" />
      <dl className="sr-narrative-meta">
        {statuses.map((s) => (
          <div key={s.label} className="sr-narrative-meta-row">
            <dt>{s.label}</dt>
            <dd>
              {s.pulse && <span className="sr-hud-dot" aria-hidden="true" />}
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
