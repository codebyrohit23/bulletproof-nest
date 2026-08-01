export interface RequestPayload {
  id: string;

  method: string;

  url: string;

  path: string;

  ip: string;

  userAgent?: string;
}
