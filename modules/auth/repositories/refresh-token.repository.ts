import { Prisma, RefreshToken } from "@/app/generated/prisma/client";
import type { DbClient } from "@/lib/prisma";

class RefreshTokenRepository {
  /** Create a new refresh token. */
  async create(
    db: DbClient,
    data: Prisma.RefreshTokenCreateInput,
  ): Promise<RefreshToken> {
    return db.refreshToken.create({ data });
  }

  /** Find a refresh token by its hash. */
  async findByTokenHash(
    db: DbClient,
    tokenHash: string,
  ): Promise<RefreshToken | null> {
    return db.refreshToken.findUnique({ where: { tokenHash } });
  }

  /** Find the active refresh token for a user. */
  async findActiveByUserId(
    db: DbClient,
    userId: string,
  ): Promise<RefreshToken | null> {
    return db.refreshToken.findFirst({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Revoke all refresh tokens belonging to a user. */
  async revokeAllForUser(
    db: DbClient,
    userId: string,
  ): Promise<Prisma.BatchPayload> {
    return db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Find a refresh token by ID. */
  async findById(db: DbClient, id: string): Promise<RefreshToken | null> {
    return db.refreshToken.findUnique({ where: { id } });
  }

  /** Update a refresh token. */
  async update(
    db: DbClient,
    id: string,
    data: Prisma.RefreshTokenUpdateInput,
  ): Promise<RefreshToken> {
    return db.refreshToken.update({ where: { id }, data });
  }

  /** Revoke a refresh token. */
  async revoke(db: DbClient, id: string): Promise<RefreshToken> {
    return db.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  /** Replace a refresh token with a new one. */
  async replace(
    db: DbClient,
    id: string,
    replacedByTokenId: string,
  ): Promise<RefreshToken> {
    return db.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), replacedByTokenId },
    });
  }

  /** Delete a refresh token. */
  async delete(db: DbClient, id: string): Promise<RefreshToken> {
    return db.refreshToken.delete({ where: { id } });
  }

  /** Delete all refresh tokens belonging to a user. */
  async deleteAllForUser(
    db: DbClient,
    userId: string,
  ): Promise<Prisma.BatchPayload> {
    return db.refreshToken.deleteMany({ where: { userId } });
  }

  /** Delete all expired refresh tokens. */
  async deleteExpired(db: DbClient): Promise<Prisma.BatchPayload> {
    return db.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  /** Delete revoked refresh tokens. */
  async deleteRevoked(db: DbClient): Promise<Prisma.BatchPayload> {
    return db.refreshToken.deleteMany({ where: { revokedAt: { not: null } } });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();