import { Text } from '@react-email/components';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

import { EMAIL_THEME } from './email-theme.js';

interface EmailTextProps {
  readonly children: ReactNode;

  /** Secondary copy — expiry notes, "you can ignore this", the small print. */
  readonly muted?: boolean;
}

export function EmailText({ children, muted = false }: EmailTextProps): ReactElement {
  return <Text style={muted ? mutedStyle : baseStyle}>{children}</Text>;
}

const baseStyle: CSSProperties = {
  margin: `0 0 ${EMAIL_THEME.space.sm}`,
  color: EMAIL_THEME.color.text,
  fontFamily: EMAIL_THEME.font.family,
  fontSize: EMAIL_THEME.font.size.body,
  lineHeight: '24px',
};

const mutedStyle: CSSProperties = {
  ...baseStyle,
  color: EMAIL_THEME.color.muted,
  fontSize: EMAIL_THEME.font.size.small,
};
