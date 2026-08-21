import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { AppConfigModule } from '#/config/index.js';

import { PrismaHealthIndicator } from './indicators/prisma-health.indicator.js';
import { PrismaService } from './prisma.service.js';
import { TransactionContextService, TransactionService } from './services/index.js';

@Global()
@Module({
  imports: [AppConfigModule, TerminusModule],
  providers: [TransactionContextService, PrismaService, TransactionService, PrismaHealthIndicator],
  exports: [PrismaService, TransactionService, TransactionContextService, PrismaHealthIndicator],
})
export class PrismaModule {}
