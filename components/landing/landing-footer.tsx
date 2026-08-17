import { PLATFORM_NAME } from "@/lib/constants/brand";

export function LandingFooter() {
  return (
    <footer className="sr-footer-link" style={{ marginTop: 8, textAlign: "left" }}>
      {PLATFORM_NAME} · Unauthorized access is logged and monitored.
    </footer>
  );
}