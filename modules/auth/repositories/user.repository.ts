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
}

export const userRepository = new UserRepository();
