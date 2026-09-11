import { render } from '@react-email/render';

import type { RenderedEmail } from '../interfaces/index.js';

import { parseTemplateData, requireEmailTemplate } from './template.registry.js';

/**
 * Turns a template id and untrusted data into the three strings a transport
 * needs.
 *
 * `data` is `unknown` because that is the truth — it has been through
 * `JSON.stringify` and back, and nothing about its shape survived. The
 * template's own schema is what makes it safe again.
 */
export async function renderEmail(templateId: string, data: unknown): Promise<RenderedEmail> {
  const template = requireEmailTemplate(templateId);

  /*
   * `EMAIL_TEMPLATES` is a union of templates with different data types, so
   * `subject` and `component` are a union of functions TypeScript will only call
   * with the intersection of their parameters. The cast supplies that, and it is
   * safe precisely here: the line above proved the value matches this template's
   * schema, with no branch in between.
   */
  const validated = parseTemplateData(template, data) as never;

  const element = template.component(validated);

  /*
   * Both renderings come from the same element, so the plain-text part can never
   * drift from the HTML the way a separately maintained text template does.
   */
  const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);

  return { subject: template.subject(validated), html, text };
}
