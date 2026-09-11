export interface ResendSendEmailRequest {
  readonly from: string;

  readonly to: readonly string[];

  readonly subject: string;

  readonly html: string;

  readonly text: string;

  readonly reply_to?: string;

  readonly headers?: Readonly<Record<string, string>>;

  readonly attachments?: readonly ResendAttachment[];
}

export interface ResendAttachment {
  readonly filename: string;

  readonly content: string;

  readonly content_type?: string;
}

export interface ResendErrorBody {
  readonly statusCode?: number;

  readonly message?: string;

  readonly name?: string;
}

export interface ResendHttpResult {
  readonly status: number;

  readonly body: unknown;
}
