import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { AppConfigModule } from '@/config/index.js';

import { PrismaHealthIndicator } from './indicators/prisma-health.indicator.js';
import { PrismaService } from './prisma.service.js';
import { TransactionContextService, TransactionService } from './services/index.js';

/**
 * Wiring only. Everything this module does lives in the services, providers and
 * extensions it registers.
 *
 * `@Global()` because the database is genuinely needed everywhere — feature
 * modules should not have to import it to declare a repository.
 */
@Global()
@Module({
  imports: [AppConfigModule, TerminusModule],
  providers: [TransactionContextService, PrismaService, TransactionService, PrismaHealthIndicator],
  exports: [PrismaService, TransactionService, TransactionContextService, PrismaHealthIndicator],
})
export class PrismaModule {}
