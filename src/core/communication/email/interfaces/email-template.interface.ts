import type { ReactElement } from 'react';
import type { ZodType } from 'zod';

import type { EmailCategory, EmailTemplateId } from '../constants/index.js';

export interface EmailTemplate<TData> {
  readonly id: EmailTemplateId;

  readonly category: EmailCategory;

  readonly schema: ZodType<TData>;

  readonly subject: (data: TData) => string;

  readonly component: (data: TData) => ReactElement;
}

export interface RenderedEmail {
  readonly subject: string;

  readonly html: string;

  readonly text: string;
}
