/** Matches the header bell badge's --sr-crimson-hot — the two "you have something unread" signals should read as the same color. */
export function NotificationUnreadDot() {
  return <span className="size-1.5 shrink-0 rounded-full bg-(--sr-crimson-hot)" aria-hidden="true" />;
}