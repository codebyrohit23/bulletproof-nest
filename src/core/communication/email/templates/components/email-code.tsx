import { Section, Text } from '@react-email/components';
import type { CSSProperties, ReactElement } from 'react';

import { EMAIL_THEME } from './email-theme.js';

interface EmailCodeProps {
  readonly value: string;
}

export function EmailCode({ value }: EmailCodeProps): ReactElement {
  return (
    <Section style={sectionStyle}>
      <Text style={codeStyle}>{value}</Text>
    </Section>
  );
}

const sectionStyle: CSSProperties = {
  margin: `${EMAIL_THEME.space.md} 0`,
  padding: EMAIL_THEME.space.md,
  backgroundColor: EMAIL_THEME.color.page,
  borderRadius: EMAIL_THEME.radius,
  textAlign: 'center',
};

const codeStyle: CSSProperties = {
  margin: '0',
  color: EMAIL_THEME.color.text,
  fontFamily: EMAIL_THEME.font.mono,
  fontSize: EMAIL_THEME.font.size.code,
  fontWeight: 700,
  letterSpacing: '6px',
  lineHeight: '40px',
};
