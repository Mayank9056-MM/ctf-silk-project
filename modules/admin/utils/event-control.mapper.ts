import type { EventControl } from "@/app/generated/prisma/client";
import type { EventControlDTO } from "@/modules/admin/types/event-control.dto";

/**
 * Maps the Prisma EventControl model to the application-facing DTO.
 * Every field is a direct, unmodified pass-through — no field on
 * EventControlDTO requires derivation, serialization, or a nullability
 * change from its Prisma counterpart.
 */
export function toEventControlDTO(eventControl: EventControl): EventControlDTO {
  return {
    id: eventControl.id,
    mode: eventControl.mode,
    registrationEnabled: eventControl.registrationEnabled,
    pausedAt: eventControl.pausedAt,
    pauseReason: eventControl.pauseReason,
    pausedById: eventControl.pausedById,
    updatedAt: eventControl.updatedAt,
  };
}
