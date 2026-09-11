import { Body, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { EMAIL_BRAND } from '../../constants/index.js';

import { EMAIL_THEME } from './email-theme.js';

interface EmailLayoutProps {
  /**
   * The grey line an inbox shows after the subject.
   *
   * Required rather than optional: left unset, clients invent one from the first
   * words of the body, which for a code email reads "Use this code to verify".
   * It is prime space in a crowded list and should be chosen, not inherited.
   */
  readonly preview: string;

  readonly children: ReactNode;
}

/**
 * The frame every transactional email sits in.
 *
 * A template supplies content and nothing else — no colours, no widths, no
 * footer. That is what keeps forty templates consistent, and what makes a
 * rebrand a change to `email-theme.ts` rather than a sweep through the catalog.
 *
 * A marketing layout will be a sibling of this rather than a flag on it: it
 * needs an unsubscribe block and a different footer, and threading both through
 * one component would make every template read as a conditional.
 */
export function EmailLayout({ preview, children }: EmailLayoutProps): ReactElement {
  return (
    <Html lang="en">
      <Head />

      <Preview>{preview}</Preview>

      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section>
            <Text style={brandStyle}>{EMAIL_BRAND.NAME}</Text>
          </Section>

          <Section>{children}</Section>

          <Hr style={dividerStyle} />

          <Section>
            <Text style={footerStyle}>
              {EMAIL_BRAND.NAME} · Sent because of activity on your account.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: CSSProperties = {
  margin: '0',
  padding: `${EMAIL_THEME.space.lg} 0`,
  backgroundColor: EMAIL_THEME.color.page,
  fontFamily: EMAIL_THEME.font.family,
};

const containerStyle: CSSProperties = {
  maxWidth: EMAIL_THEME.maxWidth,
  margin: '0 auto',
  padding: EMAIL_THEME.space.lg,
  backgroundColor: EMAIL_THEME.color.surface,
  border: `1px solid ${EMAIL_THEME.color.border}`,
  borderRadius: EMAIL_THEME.radius,
};

const brandStyle: CSSProperties = {
  margin: `0 0 ${EMAIL_THEME.space.md}`,
  color: EMAIL_THEME.color.text,
  fontSize: EMAIL_THEME.font.size.brand,
  fontWeight: 700,
};

const dividerStyle: CSSProperties = {
  margin: `${EMAIL_THEME.space.lg} 0 ${EMAIL_THEME.space.md}`,
  border: 'none',
  borderTop: `1px solid ${EMAIL_THEME.color.border}`,
};

const footerStyle: CSSProperties = {
  margin: '0',
  color: EMAIL_THEME.color.muted,
  fontSize: EMAIL_THEME.font.size.small,
  lineHeight: '20px',
};
