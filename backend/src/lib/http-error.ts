// Error carrying an HTTP status and a client-safe message. The message is a
// translation key resolved by the error middleware using the request locale.
// `code` is an optional stable machine-readable identifier; `details` carries
// an optional field->message map (already-localized) for form validation.
export class HttpError extends Error {
  status: number;
  publicMessage: string;
  code?: string;
  vars?: Record<string, string | number>;
  details?: Record<string, string>;

  constructor(
    status: number,
    messageKey: string,
    opts: {
      code?: string;
      vars?: Record<string, string | number>;
      details?: Record<string, string>;
    } = {},
  ) {
    super(messageKey);
    this.status = status;
    this.publicMessage = messageKey;
    this.code = opts.code;
    this.vars = opts.vars;
    this.details = opts.details;
  }
}
