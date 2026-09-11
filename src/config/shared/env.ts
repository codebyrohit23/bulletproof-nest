import 'dotenv/config';

import { validateEnv } from './validate-env.js';

export const env = validateEnv();
