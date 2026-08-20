import { Inbox } from "lucide-react";

export function OpsEmptyState({ message }: { message: string }) {
  return (
    <div className="ops-empty flex flex-col items-center gap-2 text-center">
      <Inbox className="size-5 text-[var(--ops-text-faint)]" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}