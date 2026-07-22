import { Prisma, Role, User } from "@/app/generated/prisma/client";

import prisma from "@/lib/prisma";
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
import { tokenService } from "./access-token.service";

export type PublicUser = Omit<
  User,
  "passwordHash" | "failedLoginAttempts" | "lockedUntil"
>;

function toPublicUser(user: User): PublicUser {
  const { passwordHash, failedLoginAttempts, lockedUntil, ...publicUser } =
    user;
  return publicUser;
}

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
      return toPublicUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const target = (error.meta?.target as string[] | undefined)?.[0];
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
      throw ApiError.tooManyRequests(
        ErrorCode.ACCOUNT_LOCKED,
        `Account is temporarily locked. Try again in ${minutesRemaining} minute(s).`,
      );
    }

    if (user.status === "BANNED") {
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
      await this.handleFailedLogin(user.id, user.failedLoginAttempts);
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
    });

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

    await prisma.$transaction(async (tx) => {
      await userRepository.incrementFailedLoginAttempts(tx, userId);
      if (shouldLock) {
        await userRepository.lockAccount(
          tx,
          userId,
          new Date(Date.now() + AUTH_CONSTANTS.ACCOUNT_LOCK_DURATION_MS),
        );
      }
    });
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
    const accessToken = tokenService.generateAccessToken({ userId, role });
    await cookieService.setAccessToken(accessToken);
    await cookieService.setRefreshToken(rawRefreshToken);
  }

  private async simulatePasswordVerification(): Promise<void> {
    const dummyHash = await getDummyHash();
    await passwordService.verify("irrelevant", dummyHash);
  }
}

export const authService = new AuthService();
