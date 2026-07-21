import { Prisma, RefreshToken } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";

class RefreshTokenRepository {
  /**
   * Create a new refresh token.
   */
  async create(data: Prisma.RefreshTokenCreateInput): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  /**
   * Find a refresh token by its hash.
   */
  async findTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
    });
  }

  /**
   * Find a refresh token by ID.
   */
  async findById(id: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Update a refresh token.
   */
  async update(
    id: string,
    data: Prisma.RefreshTokenUpdateInput,
  ): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: {
        id,
      },
      data,
    });
  }

  /**
   * Revoke a refresh token
   */
  async revoke(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  /**
   * Replace a refresh token with a new one.
   */
  async replace(id: string, replacedByTokenId: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
        replacedByTokenId,
      },
    });
  }

  /**
   * Delete a refresh token
   */
  async delete(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.delete({
      where: {
        id,
      },
    });
  }

  /**
   * Delete all refresh tokens belonging to a user
   */
  async deleteAllForUser(userId: string): Promise<Prisma.BatchPayload> {
    return prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Delete revoked refresh token.
   */
  async deleteRevoked(): Promise<Prisma.BatchPayload> {
    return prisma.refreshToken.deleteMany({
      where: {
        revokedAt: {
          not: null,
        },
      },
    });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
