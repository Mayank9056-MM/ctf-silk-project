import { LeaderboardPanel } from "@/components/admin/leaderboard/leaderboard-panel";


export default function AdminLeaderboardPage() {
  return (
    <div className="space-y-6">
      <div className="ops-page-header">
        <div>
          <h1 className="ops-page-title">Leaderboard</h1>
          <p className="ops-page-subtitle">
            Live standings. Freezing hides shifts from players without
            affecting this admin view.
          </p>
        </div>
      </div>

      <LeaderboardPanel />
    </div>
  );
}
