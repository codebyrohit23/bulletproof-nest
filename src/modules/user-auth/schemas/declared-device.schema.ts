import { DeviceType } from '@prisma/client';
import { z } from 'zod';

import { DEVICE_FIELD_MAX_LENGTH } from '../constants/index.js';

export const declaredDeviceSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(DEVICE_FIELD_MAX_LENGTH.NAME)
      .optional()
      .describe('The user-facing device name — "Rohit\'s iPhone". Native clients only.'),

    type: z
      .enum(DeviceType)
      .optional()
      .describe('Phone versus tablet, which no native User-Agent carries.'),

    osVersion: z
      .string()
      .trim()
      .min(1)
      .max(DEVICE_FIELD_MAX_LENGTH.OS_VERSION)
      .optional()
      .describe('The OS build — `17.4`, `14`. The OS *name* is fixed by `platform`.'),
  })
  .strict();

export const DECLARED_DEVICE_DESCRIPTION =
  'Device facts only a native app can answer. Omit from web clients — for those every field ' +
  'here is derived from the User-Agent and Client Hints instead.';
