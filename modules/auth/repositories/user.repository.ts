import { Prisma, User } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";

class UserRepository {
  /**
   * Create a new user.
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Find a user by ID.
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Find a user by email.
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  /**
   * Find a user by username.
   */
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        username,
      },
    });
  }

  /**
   * Update user.
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data,
    });
  }

  /**
   * Update password hash.
   */
  async updatePasswordHash(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });
  }

  /**
   * Update last login timestamp.
   */
  async updateLastLogin(id: string): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  /**
   * Increment failed login attempts.
   */
  async incrementFailedLoginAttempts(id: string): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        failedLoginAttempts: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Reset failed login attempts.
   */
  async resetFailedLoginAttempts(id: string): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Lock account until a given time.
   */
  async lockAccount(id: string, lockedUntil: Date): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        lockedUntil,
      },
    });
  }
}

export const userRepository = new UserRepository();
