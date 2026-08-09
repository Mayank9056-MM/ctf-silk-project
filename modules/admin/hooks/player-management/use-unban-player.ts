"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { UnbanPlayerSchema } from "../../validations/player-management/unban-player.schema";
import type { PlayerDTO } from "../../types/player-management.dto";

import { unbanPlayer } from "../../actions/player-management/unban-player";
import { playerManagementKeys } from "../../constants/player-management.keys";

/**
 * Unbans a player through the Player Management Server Action.
 *
 * Returns the standard TanStack Query mutation object untouched.
 *
 * On successful unban:
 * - the affected player's detail cache is invalidated
 * - all Player Management list queries are invalidated because the
 *   player's status may affect multiple filtered/paginated lists
 *
 * Business logic remains on the server:
 * authorization, status transition, transaction handling, audit
 * recording, and notification creation.
 */
export function useUnbanPlayer() {
  const queryClient = useQueryClient();

  return useMutation<PlayerDTO, Error, UnbanPlayerSchema>({
    mutationFn: (input) => unbanPlayer(input.playerId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: playerManagementKeys.detail(variables.playerId),
      });

      queryClient.invalidateQueries({
        queryKey: playerManagementKeys.all,
      });
    },
  });
}
