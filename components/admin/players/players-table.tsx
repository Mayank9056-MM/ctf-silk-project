import { UserStatus } from "@/app/generated/prisma/enums";
import type { PlayerDTO } from "@/modules/admin/types/player-management.dto";
import { PlayerRowActions } from "./player-row-actions";

interface PlayersTableProps {
  players: readonly PlayerDTO[];
}

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function PlayersTable({ players }: PlayersTableProps) {
  if (players.length === 0) {
    return <div className="ops-empty">No players match these filters.</div>;
  }

  return (
    <div className="ops-table-wrap">
      <table className="ops-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Email</th>
            <th>Status</th>
            <th>Failed logins</th>
            <th>Last login</th>
            <th>Registered</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const isLocked = player.lockedUntil && new Date(player.lockedUntil) > new Date();
            return (
              <tr key={player.id}>
                <td>
                  <div className="font-medium">{player.username}</div>
                  <div className="text-xs text-[var(--ops-text-dim)]">
                    {player.fullName}
                  </div>
                </td>
                <td className="ops-table-mono">{player.email}</td>
                <td>
                  <span
                    className="ops-badge"
                    data-tone={player.status === UserStatus.BANNED ? "critical" : "ok"}
                  >
                    {player.status === UserStatus.BANNED ? "Banned" : "Active"}
                  </span>
                </td>
                <td className="ops-table-mono">
                  {player.failedLoginAttempts}
                  {isLocked ? (
                    <span className="ops-badge ml-2" data-tone="warn">
                      Locked
                    </span>
                  ) : null}
                </td>
                <td className="ops-table-mono">{formatDate(player.lastLoginAt)}</td>
                <td className="ops-table-mono">{formatDate(player.createdAt)}</td>
                <td className="text-right">
                  <PlayerRowActions player={player} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
