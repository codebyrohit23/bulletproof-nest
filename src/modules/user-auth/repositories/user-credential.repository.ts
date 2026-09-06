import { Injectable } from '@nestjs/common';
import type { UserCredential } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

@Injectable()
export class UserCredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserCredential | null> {
    return this.prisma.db.userCredential.findUnique({
      where: { userId },
    });
  }
  async create(userId: string, passwordHash: string): Promise<UserCredential> {
    return this.prisma.db.userCredential.create({
      data: { userId, passwordHash },
    });
  }

  async upsert(userId: string, passwordHash: string): Promise<UserCredential> {
    return this.prisma.db.userCredential.upsert({
      where: { userId },
      create: { userId, passwordHash },
      update: { passwordHash, passwordChangedAt: new Date() },
    });
  }

  async rehashPassword(userId: string, passwordHash: string): Promise<UserCredential> {
    return this.prisma.db.userCredential.update({
      where: { userId },
      data: { userId, passwordHash },
    });
  }
}
