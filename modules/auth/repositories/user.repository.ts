import { Prisma, User, UserStatus } from "@/app/generated/prisma/client";
import type { DbClient } from "@/lib/prisma";

class UserRepository {
  /** Create a new user. */
  async create(db: DbClient, data: Prisma.UserCreateInput): Promise<User> {
    return db.user.create({ data });
  }

  /** Find a user by ID. */
  async findById(db: DbClient, id: string): Promise<User | null> {
    return db.user.findUnique({ where: { id } });
  }

  /** Find a user by email. */
  async findByEmail(db: DbClient, email: string): Promise<User | null> {
    return db.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  /** Check if a user with the given email exists. */
  async existsByEmail(db: DbClient, email: string): Promise<boolean> {
    return Boolean(await this.findByEmail(db, email));
  }

  /** Find a user by username. */
  async findByUsername(db: DbClient, username: string): Promise<User | null> {
    return db.user.findUnique({ where: { username: username.toLowerCase() } });
  }

  /** Check if a user with the given username exists. */
  async existsByUsername(db: DbClient, username: string): Promise<boolean> {
    return Boolean(await this.findByUsername(db, username));
  }

  /** Update user. */
  async update(
    db: DbClient,
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<User> {
    return db.user.update({ where: { id }, data });
  }

  /** Update password hash. */
  async updatePasswordHash(
    db: DbClient,
    id: string,
    passwordHash: string,
  ): Promise<User> {
    return db.user.update({
      where: { id },
      data: { passwordHash, passwordChangedAt: new Date() },
    });
  }

  /** Update last login timestamp. */
  async updateLastLogin(db: DbClient, id: string): Promise<User> {
    return db.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  /** Update user status. */
  async updateStatus(
    db: DbClient,
    id: string,
    status: UserStatus,
  ): Promise<User> {
    return db.user.update({ where: { id }, data: { status } });
  }

  /** Increment failed login attempts. */
  async incrementFailedLoginAttempts(db: DbClient, id: string): Promise<User> {
    return db.user.update({
      where: { id },
      data: { failedLoginAttempts: { increment: 1 } },
    });
  }

  /** Reset failed login attempts. */
  async resetFailedLoginAttempts(db: DbClient, id: string): Promise<User> {
    return db.user.update({
      where: { id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  /** Lock account until a given time. */
  async lockAccount(
    db: DbClient,
    id: string,
    lockedUntil: Date,
  ): Promise<User> {
    return db.user.update({ where: { id }, data: { lockedUntil } });
  }

  /** Unlock account. */
  async unlockAccount(db: DbClient, id: string): Promise<User> {
    return db.user.update({
      where: { id },
      data: { lockedUntil: null, failedLoginAttempts: 0 },
    });
  }

  /**
   * Conditionally transitions status only if the row's CURRENT status
   * matches `expectedStatus` at the moment of the UPDATE — closes the
   * check-then-write race a plain findPlayerById()-then-updateStatus()
   * sequence leaves open under concurrent admin requests. Built on
   * updateMany(), not update() — update() requires a unique-only WHERE
   * and cannot also condition on a non-unique column like `status`;
   * updateMany() is the only Prisma method that expresses "id AND
   * current status" as one atomic UPDATE ... WHERE, letting Postgres's
   * own row-level locking (not application logic) decide the race.
   *
   * Returns true iff exactly one row transitioned. false means either
   * the id doesn't exist, or — the case this exists to catch — another
   * request already changed the status first. The caller MUST treat
   * false as a conflict, never retry silently or ignore it.
   */
  async updateStatusIf(
    db: DbClient,
    id: string,
    expectedStatus: UserStatus,
    newStatus: UserStatus,
  ): Promise<boolean> {
    const result = await db.user.updateMany({
      where: { id, status: expectedStatus },
      data: { status: newStatus },
    });
    return result.count === 1;
  }

  /**
   * Conditionally updates passwordHash only if `passwordChangedAt`
   * still matches the value the caller read before generating the new
   * password — an optimistic-concurrency guard reusing a column that
   * already exists on User (see schema.prisma), not a new version
   * field. Two concurrent resets both read the same starting
   * `passwordChangedAt`; only the first to commit changes it, so the
   * second's conditional UPDATE matches zero rows here. That's the
   * exact signal the caller needs to know ITS generated temporary
   * password does NOT correspond to what is actually stored, and must
   * not be handed to an admin.
   *
   * `expectedPasswordChangedAt` may legitimately be null (a user with
   * no recorded password change) — Prisma's where clause handles
   * `passwordChangedAt: null` as IS NULL correctly, no special-casing
   * needed.
   */
  async updatePasswordHashIf(
    db: DbClient,
    id: string,
    expectedPasswordChangedAt: Date | null,
    newPasswordHash: string,
  ): Promise<boolean> {
    const result = await db.user.updateMany({
      where: { id, passwordChangedAt: expectedPasswordChangedAt },
      data: { passwordHash: newPasswordHash, passwordChangedAt: new Date() },
    });
    return result.count === 1;
  }
}

export const userRepository = new UserRepository();
