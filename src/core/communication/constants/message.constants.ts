export const MESSAGE_CHANNEL = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
} as const;

export type MessageChannel = (typeof MESSAGE_CHANNEL)[keyof typeof MESSAGE_CHANNEL];

export const MESSAGE_CATEGORY = {
  TRANSACTIONAL: 'TRANSACTIONAL',
  MARKETING: 'MARKETING',
} as const;

export type MessageCategory = (typeof MESSAGE_CATEGORY)[keyof typeof MESSAGE_CATEGORY];
