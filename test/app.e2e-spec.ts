import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { AppModule } from '../src/app.module.js';

/**
 * Boot smoke test.
 *
 * The controller this file used to exercise (`GET /` returning "Hello World!")
 * has been removed, so it now asserts the thing that actually matters at this
 * stage: that the container can resolve every provider.
 *
 * `compile()` builds the graph without running lifecycle hooks, so a missing
 * module import or an un-injectable dependency fails here — while
 * `onModuleInit` never runs and no database connection is opened. Tests that
 * need Postgres belong in the integration suite.
 */
describe('AppModule (e2e)', () => {
  it('resolves the full dependency graph', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleFixture).toBeDefined();

    await moduleFixture.close();
  });
});
