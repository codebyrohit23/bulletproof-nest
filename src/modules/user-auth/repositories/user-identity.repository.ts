import { Injectable } from '@nestjs/common';
import type { IdentifierType, UserIdentity } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js'; // value import — required for DI metadata

import type {
  CreateIdentityInput,
  UserIdentityWithUser,
  UserIdentityWithUserAndCredential,
} from '../interfaces/index.js';
import { normalizeIdentifier } from '../utils/index.js';

@Injectable()
export class UserIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findIdentityWithUser(
    identifierType: IdentifierType,
    identifierValue: string,
  ): Promise<UserIdentityWithUser | null> {
    return this.prisma.db.userIdentity.findUnique({
      where: {
        identifierValue_identifierType: {
          identifierValue: normalizeIdentifier(identifierType, identifierValue),
          identifierType,
        },
      },
      select: {
        id: true,
        userId: true,
        user: { select: { state: true } },
      },
    });
  }

  public findIdentityWithUserAndCredential(
    identifierType: IdentifierType,
    identifierValue: string,
  ): Promise<UserIdentityWithUserAndCredential | null> {
    return this.prisma.db.userIdentity.findUnique({
      where: {
        identifierValue_identifierType: {
          identifierValue: normalizeIdentifier(identifierType, identifierValue),
          identifierType,
        },
      },
      select: {
        id: true,
        userId: true,
        identifierType: true,
        identifierValue: true,
        verifiedAt: true,

        user: {
          select: {
            id: true,
            state: true,

            credential: {
              select: {
                passwordHash: true,
                passwordChangedAt: true,
              },
            },
          },
        },
      },
    });
  }

  async create(input: CreateIdentityInput): Promise<UserIdentity> {
    return this.prisma.db.userIdentity.create({
      data: {
        ...input,
        identifierValue: normalizeIdentifier(input.identifierType, input.identifierValue),
      },
    });
  }

  async markVerified(id: string): Promise<void> {
    await this.prisma.db.userIdentity.updateMany({
      where: { id, verifiedAt: null },
      data: { verifiedAt: new Date() },
    });
  }
}
