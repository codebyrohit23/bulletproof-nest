import { Button, Section } from '@react-email/components';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { EMAIL_THEME } from './email-theme.js';

interface EmailButtonProps {
  readonly href: string;

  readonly children: ReactNode;
}

export function EmailButton({ href, children }: EmailButtonProps): ReactElement {
  return (
    <Section style={sectionStyle}>
      <Button href={href} style={buttonStyle}>
        {children}
      </Button>
    </Section>
  );
}

const sectionStyle: CSSProperties = {
  margin: `${EMAIL_THEME.space.md} 0`,
  textAlign: 'center',
};

const buttonStyle: CSSProperties = {
  padding: `${EMAIL_THEME.space.sm} ${EMAIL_THEME.space.lg}`,
  backgroundColor: EMAIL_THEME.color.accent,
  borderRadius: EMAIL_THEME.radius,
  color: EMAIL_THEME.color.onAccent,
  fontFamily: EMAIL_THEME.font.family,
  fontSize: EMAIL_THEME.font.size.body,
  fontWeight: 600,
  textDecoration: 'none',
};
