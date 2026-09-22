import { render } from '@react-email/render';

import type { RenderedEmail } from '../interfaces/index.js';

import { parseTemplateData, requireEmailTemplate } from './template.registry.js';

export async function renderEmail(templateId: string, data: unknown): Promise<RenderedEmail> {
  const template = requireEmailTemplate(templateId);

  const validated = parseTemplateData(template, data) as never;

  const element = template.component(validated);

  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);

  return { subject: template.subject(validated), html, text };
}
