/**
 * Loads `.env` before anything reads `process.env`.
 *
 * This import must stay first. Validation runs at module-evaluation time, which
 * is long before `ConfigModule.forRoot()` gets a chance to read `.env` itself —
 * so without this, every entrypoint fails at boot with "Invalid environment
 * variables" even though the file is right there.
 *
 * It belongs here rather than in `main.ts` because this is the one module that
 * reads the environment. Putting it in an entrypoint would mean every other
 * entrypoint — `worker.ts`, seeds, scripts, tests — has to remember it, and the
 * one that forgets fails confusingly.
 *
 * In production there is usually no `.env` file at all; dotenv then does
 * nothing and the values come from the platform. It also never overwrites a
 * variable that is already set, so a platform value always wins over the file.
 */
import 'dotenv/config';

import { validateEnv } from './validate-env.js';

export const env = validateEnv();
