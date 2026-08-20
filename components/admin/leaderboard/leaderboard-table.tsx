import type { AdminLeaderboardRowDTO } from "@/modules/leaderboard/types/leaderboard.dto";

interface LeaderboardTableProps {
  rows: readonly AdminLeaderboardRowDTO[];
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function LeaderboardTable({ rows }: LeaderboardTableProps) {
  if (rows.length === 0) {
    return <div className="ops-empty">No ranked players yet.</div>;
  }

  return (
    <div className="ops-table-wrap">
      <table className="ops-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Email</th>
            <th>XP</th>
            <th>Solves</th>
            <th>Last solve</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.userId}>
              <td className="ops-table-mono font-semibold text-[var(--ops-text)]">
                #{row.rank}
              </td>
              <td>
                <div className="font-medium">{row.username}</div>
                <div className="text-xs text-[var(--ops-text-dim)]">{row.fullName}</div>
              </td>
              <td className="ops-table-mono">{row.email}</td>
              <td className="ops-table-mono">{row.totalXp}</td>
              <td className="ops-table-mono">{row.solvedChallenges}</td>
              <td className="ops-table-mono">{formatDate(row.lastSolvedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
