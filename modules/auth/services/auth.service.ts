import {
  AuditActorType,
  NotificationPriority,
  NotificationType,
  Prisma,
  Role,
  User,
} from "@/app/generated/prisma/client";

import prisma from "@/lib/prisma";
import { authLogger as log } from "@/lib/logger/logger.scopes";
import { passwordService } from "./password.service";
import { RegisterInput } from "../validations/register.schema";
import { userRepository } from "../repositories/user.repository";
import { ApiError } from "@/lib/errors/ApiError";
import { ErrorCode } from "@/lib/errors/ErrorCode";
import { LoginInput } from "../validations/login.schema";
import { cookieService } from "./cookie.service";
import { refreshTokenRepository } from "../repositories/refresh-token.repository";
import { refreshTokenService } from "./refresh-token.service";
import { AUTH_CONSTANTS } from "../constants/auth.constants";
import { accessTokenService } from "./access-token.service";
import { PublicUser } from "../types/user.types";
import { toPublicUser } from "../utils/user.mapper";

import * as auditService from "../../audit/services/audit.service";
import type { AuditActor } from "../../audit/types/audit.types";
import { notificationService } from "@/modules/notification/services/notification.service";
import { eventService } from "@/modules/event/services/event.service";

interface RequestMetadata {
  userAgent?: string;
  ipAddress?: string;
}

let dummyHashPromise: Promise<string> | null = null;
function getDummyHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = passwordService.hash("timing-attack-mitigation-dummy");
  }
  return dummyHashPromise;
}

type LoginFailureReason =
  | "invalid_credentials"
  | "account_locked"
  | "account_banned";

/**
 * SYSTEM actor for background-triggered notification calls in this file
 * (refresh-token reuse, brute-force lockout) — same null-identity shape
 * auditService.recordSystemEvent() already uses. Requires
 * notification-access.ts's assertCanCreateNotification() to special-case
 * AuditActorType.SYSTEM; see that file's own updated doc comment.
 */
const SYSTEM_ACTOR: AuditActor = {
  actorType: AuditActorType.SYSTEM,
  actorId: null,
  actorUsername: null,
  actorRole: null,
};

class AuthService {
  /**
   * Register a new user account.
   * A single INSERT is already atomic at the database level — there's no
   * second dependent write to keep in sync with it, so wrapping this in
   * $transaction would add overhead with no consistency benefit. The race
   * between the existence check and the insert is instead closed by the
   * unique constraints on `email`/`username`, caught below as P2002.
   */
  async register(input: RegisterInput): Promise<PublicUser> {
    const access = await eventService.getEventAccess(prisma);

    if (!access.canRegister) {
      log.warn("Registration rejected — registration is currently closed", {
        registrationEnabled: access.registrationEnabled,
        hasEnded: access.hasEnded,
      });

      throw ApiError.forbidden(
        ErrorCode.FORBIDDEN,
        "Registration is currently closed.",
      );
    }

    const [emailTaken, usernameTaken] = await Promise.all([
      userRepository.existsByEmail(prisma, input.email),
      userRepository.existsByUsername(prisma, input.username),
    ]);

    if (emailTaken) {
      throw ApiError.conflict(
        ErrorCode.EMAIL_ALREADY_EXISTS,
        "An account with this email already exists.",
      );
    }
    if (usernameTaken) {
      throw ApiError.conflict(
        ErrorCode.USERNAME_ALREADY_EXISTS,
        "This username is already taken.",
      );
    }

    const passwordHash = await passwordService.hash(input.password);

    try {
      const user = await userRepository.create(prisma, {
        fullName: input.fullName,
        username: input.username,
        email: input.email,
        passwordHash,
      });

      log.info("User registered", { userId: user.id });

      await auditService.record(prisma, {
        eventKey: "REGISTER",
        actor: this.selfActor(user),
        resourceId: user.id,
        resourceName: user.username,
        success: true,
      });

      return toPublicUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[] | undefined)?.[0];

        log.warn("Registration race detected on unique constraint", {
          target,
        });

        if (target === "email") {
          throw ApiError.conflict(
            ErrorCode.EMAIL_ALREADY_EXISTS,
            "An account with this email already exists.",
          );
        }
        if (target === "username") {
          throw ApiError.conflict(
            ErrorCode.USERNAME_ALREADY_EXISTS,
            "This username is already taken.",
          );
        }
      }
      throw error;
    }
  }

  /**
   * Authenticate a user and establish a session.
   * The DB writes — optional password rehash, resetting failed attempts,
   * updating last login, and creating the refresh token — commit as one
   * transaction. Access token generation and cookie writes happen only
   * after that commit succeeds.
   */
  async login(
    input: LoginInput,
    metadata: RequestMetadata = {},
  ): Promise<PublicUser> {
    const user = await userRepository.findByEmail(prisma, input.email);

    if (!user) {
      log.warn("Login attempted for unknown email", { email: input.email });
      await this.auditLoginFailure(null, "invalid_credentials");
      await this.simulatePasswordVerification();
      throw ApiError.unauthorized(
        ErrorCode.INVALID_CREDENTIALS,
        "Invalid email or password.",
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60_000,
      );

      log.warn("Login attempted on locked account", {
        userId: user.id,
        minutesRemaining,
      });

      await this.auditLoginFailure(user, "account_locked");

      throw ApiError.tooManyRequests(
        ErrorCode.ACCOUNT_LOCKED,
        `Account is temporarily locked. Try again in ${minutesRemaining} minute(s).`,
      );
    }

    if (user.status === "BANNED") {
      log.warn("Login attempted on banned account", { userId: user.id });
      await this.auditLoginFailure(user, "account_banned");
      throw ApiError.forbidden(
        ErrorCode.ACCOUNT_BANNED,
        "This account has been banned.",
      );
    }

    const passwordValid = await passwordService.verify(
      input.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      log.warn("Invalid password on login attempt", { userId: user.id });
      await this.handleFailedLogin(user.id, user.failedLoginAttempts);
      await this.auditLoginFailure(user, "invalid_credentials");
      throw ApiError.unauthorized(
        ErrorCode.INVALID_CREDENTIALS,
        "Invalid email or password.",
      );
    }

    // CPU-bound argon2 work happens before the transaction opens, so the
    // transaction body contains only fast DB statements.
    const rehashedPassword = (await passwordService.needsRehash(
      user.passwordHash,
    ))
      ? await passwordService.hash(input.password)
      : null;

    const {
      rawToken: rawRefreshToken,
      tokenHash,
      expiresAt,
    } = this.generateTokenMaterials();

    await prisma.$transaction(async (tx) => {
      if (rehashedPassword) {
        await userRepository.updatePasswordHash(tx, user.id, rehashedPassword);
      }
      await userRepository.resetFailedLoginAttempts(tx, user.id);
      await userRepository.updateLastLogin(tx, user.id);
      await refreshTokenRepository.create(tx, {
        tokenHash,
        expiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        user: { connect: { id: user.id } },
      });

      await auditService.record(tx, {
        eventKey: "LOGIN",
        actor: this.selfActor(user),
        resourceId: user.id,
        resourceName: user.username,
        success: true,
      });
    });

    log.info("Login succeeded", { userId: user.id });

    await this.issueAccessAndCookies(user.id, user.role, rawRefreshToken);

    return toPublicUser(user);
  }

  /**
   * Rotate the refresh token and issue a new access token.
   * Creating the new token and revoking/linking the old one are the atomic
   * unit: if either write fails, neither takes effect, so a client never
   * ends up with a cookie that points at a token the DB doesn't have (or
   * an old token left un-rotated while a new one silently exists).
   */
  async refreshSession(metadata: RequestMetadata = {}): Promise<PublicUser> {
    const rawRefreshToken = await cookieService.getRefreshToken();

    if (!rawRefreshToken) {
      throw ApiError.unauthorized(
        ErrorCode.SESSION_EXPIRED,
        "No active session found. Please log in again.",
      );
    }

    const tokenHash = refreshTokenService.hash(rawRefreshToken);
    const existingToken = await refreshTokenRepository.findByTokenHash(
      prisma,
      tokenHash,
    );

    if (!existingToken) {
      log.warn("Refresh attempted with unrecognized token");
      await cookieService.clearAuthCookies();
      throw ApiError.unauthorized(
        ErrorCode.INVALID_REFRESH_TOKEN,
        "Session is invalid. Please log in again.",
      );
    }

    // A revoked token being presented again is the signature of a stolen or
    // replayed token, not normal use. revokeAllForUser is a single UPDATE,
    // already atomic on its own, so no transaction wrapper is needed here.
    if (existingToken.revokedAt) {
      await refreshTokenRepository.revokeAllForUser(
        prisma,
        existingToken.userId,
      );

      log.error(
        "Refresh token reuse detected — all sessions revoked",
        undefined,
        { userId: existingToken.userId },
      );

      await auditService.recordSystemEvent(
        prisma,
        "REFRESH_TOKEN_REUSE_DETECTED",
        {
          resourceId: existingToken.userId,
          success: true,
          reason: "Revoked refresh token presented again",
          metadata: { tokenId: existingToken.id },
        },
      );

      try {
        await notificationService.createNotification(SYSTEM_ACTOR, {
          userId: existingToken.userId,
          type: NotificationType.SECURITY,
          priority: NotificationPriority.HIGH,
          title: "Security alert: suspicious session activity",
          message:
            "We detected an attempt to reuse a session that had already been signed out. As a precaution, all of your active sessions have been signed out. If this wasn't you, we recommend changing your password.",
        });
      } catch (error) {
        log.error("Failed to create refresh-token-reuse notification", error, {
          userId: existingToken.userId,
        });
      }

      await cookieService.clearAuthCookies();
      throw ApiError.unauthorized(
        ErrorCode.REFRESH_TOKEN_REVOKED,
        "A security issue was detected with this session. All sessions have been signed out — please log in again.",
      );
    }

    if (existingToken.expiresAt < new Date()) {
      await refreshTokenRepository.delete(prisma, existingToken.id);
      await cookieService.clearAuthCookies();
      throw ApiError.unauthorized(
        ErrorCode.REFRESH_TOKEN_EXPIRED,
        "Session has expired. Please log in again.",
      );
    }

    const user = await userRepository.findById(prisma, existingToken.userId);

    if (!user || user.status === "BANNED") {
      log.warn("Refresh rejected — account banned or missing", {
        userId: existingToken.userId,
      });
      await refreshTokenRepository.revoke(prisma, existingToken.id);
      await cookieService.clearAuthCookies();
      throw ApiError.forbidden(
        ErrorCode.ACCOUNT_BANNED,
        "This account is no longer active.",
      );
    }

    const {
      rawToken: newRawToken,
      tokenHash: newTokenHash,
      expiresAt,
    } = this.generateTokenMaterials();

    await prisma.$transaction(async (tx) => {
      const newTokenRecord = await refreshTokenRepository.create(tx, {
        tokenHash: newTokenHash,
        expiresAt,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        user: { connect: { id: user.id } },
      });
      await refreshTokenRepository.replace(
        tx,
        existingToken.id,
        newTokenRecord.id,
      );
    });

    log.debug("Refresh token rotated", { userId: user.id });

    await this.issueAccessAndCookies(user.id, user.role, newRawToken);

    return toPublicUser(user);
  }

  /**
   * Log out of the current session only.
   * A single conditional UPDATE is already atomic, so no transaction is
   * used. Cookie clearing always runs, even if there was no DB row to
   * revoke — the client's session ends either way.
   */
  async logout(): Promise<void> {
    const rawRefreshToken = await cookieService.getRefreshToken();

    if (rawRefreshToken) {
      const tokenHash = refreshTokenService.hash(rawRefreshToken);
      const existingToken = await refreshTokenRepository.findByTokenHash(
        prisma,
        tokenHash,
      );
      if (existingToken && !existingToken.revokedAt) {
        await refreshTokenRepository.revoke(prisma, existingToken.id);

        log.info("User logged out", { userId: existingToken.userId });

        await auditService.record(prisma, {
          eventKey: "LOGOUT",
          actor: {
            actorType: AuditActorType.USER,
            actorId: existingToken.userId,
            actorUsername: null,
            actorRole: null,
          },
          resourceId: existingToken.userId,
          success: true,
        });
      }
    }

    await cookieService.clearAuthCookies();
  }

  /**
   * Revoke every session for a user — call on ban, password change, or an
   * explicit "log out everywhere" action. A single updateMany is already
   * atomic, so no transaction wrapper is needed.
   */
  async logoutAllSessions(userId: string): Promise<void> {
    await refreshTokenRepository.revokeAllForUser(prisma, userId);
    log.info("All sessions revoked for user", { userId });
  }

  /**
   * Record a failed login attempt and lock the account once the threshold
   * is hit. These two writes are wrapped in a transaction because they're
   * dependent updates to the same row — without atomicity, a failure
   * between the increment and the lock could leave the count incremented
   * but the lockout never applied.
   */
  private async handleFailedLogin(
    userId: string,
    currentAttempts: number,
  ): Promise<void> {
    const shouldLock =
      currentAttempts + 1 >= AUTH_CONSTANTS.MAX_FAILED_LOGIN_ATTEMPTS;

    log.debug("Incrementing failed login attempts", {
      userId,
      attempts: currentAttempts + 1,
    });

    const lockedUntilForNotification = await prisma.$transaction(async (tx) => {
      await userRepository.incrementFailedLoginAttempts(tx, userId);

      if (!shouldLock) {
        return null;
      }

      const lockedUntil = new Date(
        Date.now() + AUTH_CONSTANTS.ACCOUNT_LOCK_DURATION_MS,
      );

      await userRepository.lockAccount(tx, userId, lockedUntil);

      log.warn("Account locked after repeated failed logins", {
        userId,
        attempts: currentAttempts + 1,
      });

      await auditService.recordSystemEvent(tx, "ACCOUNT_LOCKED", {
        resourceId: userId,
        success: true,
        metadata: {
          failedAttempts: currentAttempts + 1,
          lockedUntil,
        },
      });

      return lockedUntil;
    });

    if (lockedUntilForNotification) {
      try {
        await notificationService.createNotification(SYSTEM_ACTOR, {
          userId,
          type: NotificationType.SECURITY,
          priority: NotificationPriority.HIGH,
          title: "Account temporarily locked",
          message:
            "Your account was temporarily locked after repeated failed login attempts. If this wasn't you, consider changing your password once you regain access.",
        });
      } catch (error) {
        log.error("Failed to create account-locked notification", error, {
          userId,
        });
      }
    }
  }

  /** Shared raw-token/hash/expiry generation used by both login and refresh. */
  private generateTokenMaterials(): {
    rawToken: string;
    tokenHash: string;
    expiresAt: Date;
  } {
    const rawToken = refreshTokenService.generate();
    const tokenHash = refreshTokenService.hash(rawToken);
    const expiresAt = refreshTokenService.generateExpiryDate();
    return { rawToken, tokenHash, expiresAt };
  }

  /** Shared post-commit step: mint the access token, set both cookies. */
  private async issueAccessAndCookies(
    userId: string,
    role: Role,
    rawRefreshToken: string,
  ): Promise<void> {
    const accessToken = accessTokenService.generateAccessToken({
      userId,
      role,
    });
    await cookieService.setAccessToken(accessToken);
    await cookieService.setRefreshToken(rawRefreshToken);
  }

  private async simulatePasswordVerification(): Promise<void> {
    const dummyHash = await getDummyHash();
    await passwordService.verify("irrelevant", dummyHash);
  }

  private selfActor(user: Pick<User, "id" | "username" | "role">): AuditActor {
    return {
      actorType: AuditActorType.USER,
      actorId: user.id,
      actorUsername: user.username,
      actorRole: user.role,
    };
  }

  /**
   * Shared LOGIN-failure audit call. `user` is null for the
   * unknown-email case, where there's no account to attribute the
   * attempt to — actorId stays null, actorUsername carries the
   * attempted email instead, for admin-side correlation only (this
   * value never reaches the client).
   */
  private async auditLoginFailure(
    user: Pick<User, "id" | "username" | "role" | "email"> | null,
    reason: LoginFailureReason,
  ): Promise<void> {
    const actor: AuditActor = user
      ? this.selfActor(user)
      : {
          actorType: AuditActorType.USER,
          actorId: null,
          actorUsername: null,
          actorRole: null,
        };

    await auditService.recordFailure(prisma, "LOGIN", actor, reason, {
      resourceId: user?.id ?? null,
      resourceName: user?.username ?? null,
    });
  }
}

export const authService = new AuthService();
