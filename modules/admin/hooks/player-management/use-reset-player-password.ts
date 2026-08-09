"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { ResetPlayerPasswordResult } from "../../services/player-management.service";
import type { ResetPlayerPasswordSchema } from "../../validations/player-management/reset-player-password.schema";

import { resetPlayerPassword } from "../../actions/player-management/reset-player-password";
import { playerManagementKeys } from "../../constants/player-management.keys";

export function useResetPlayerPassword() {
  const queryClient = useQueryClient();

  return useMutation<
    ResetPlayerPasswordResult,
    Error,
    ResetPlayerPasswordSchema
  >({
    mutationFn: (input) => resetPlayerPassword(input.playerId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: playerManagementKeys.detail(variables.playerId),
      });
    },
  });
}
