interface CinematicLetterboxProps {
  active: boolean;
}

/** CSS-driven (see .sr-stage-letterbox in globals.css) rather than Motion/GSAP — a letterbox bar is a binary on/off state with one transition, not a sequence, so a CSS transition is the cheapest correct tool. */
export function CinematicLetterbox({ active }: CinematicLetterboxProps) {
  return <div className="sr-stage-letterbox" data-active={active} aria-hidden="true" />;
}