import { Role } from "@/app/generated/prisma/enums";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import type { AuditActor } from "@/modules/audit/types/audit.types";

export function assertCanAccessAdmin(actor: AuditActor): void {
  if (actor.actorRole !== Role.SUPER_ADMIN) {
    throw ApiError.forbidden(
      ErrorCode.FORBIDDEN,
      "You do not have permission to perform this action.",
    );
  }
}
