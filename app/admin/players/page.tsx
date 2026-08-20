import { PlayersPanel } from "@/components/admin/players/players-panel";


export default function AdminPlayersPage() {
  return (
    <div className="space-y-6">
      <div className="ops-page-header">
        <div>
          <h1 className="ops-page-title">Players</h1>
          <p className="ops-page-subtitle">
            Search, ban, unban, and reset credentials for registered players.
          </p>
        </div>
      </div>

      <PlayersPanel />
    </div>
  );
}
