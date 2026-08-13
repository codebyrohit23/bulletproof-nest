import { Injectable } from '@nestjs/common';
import type { UserCredential } from '@prisma/client';

import type { PrismaService } from '#/infrastructure/database/prisma/index.js';

@Injectable()
export class UserCredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserCredential | null> {
    return this.prisma.db.userCredential.findUnique({ where: { userId } });
  }

  async create(userId: string, passwordHash: string): Promise<UserCredential> {
    return this.prisma.db.userCredential.create({
      data: { userId, passwordHash },
    });
  }
}
