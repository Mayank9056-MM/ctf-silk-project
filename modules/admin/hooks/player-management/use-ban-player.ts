"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { BanPlayerSchema } from "../../validations/player-management/ban-player.schema";
import type { PlayerDTO } from "../../types/player-management.dto";

import { banPlayer } from "../../actions/player-management/ban-player";
import { playerManagementKeys } from "../../constants/player-management.keys";

/**
 * Bans a player through the Player Management Server Action.
 *
 * Returns the standard TanStack Query mutation object untouched.
 *
 * On successful ban:
 * - the affected player's detail cache is invalidated
 * - the Player Management root cache is invalidated so all cached
 *   filtered/paginated player lists are considered stale
 *
 * Business logic remains on the server:
 * authorization, status transition, transaction handling,
 * refresh-token revocation, audit recording, and notification creation.
 */
export function useBanPlayer() {
  const queryClient = useQueryClient();

  return useMutation<PlayerDTO, Error, BanPlayerSchema>({
    mutationFn: (input) => banPlayer(input.playerId),

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
