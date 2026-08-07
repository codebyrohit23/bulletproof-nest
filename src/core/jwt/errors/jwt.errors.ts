export abstract class JwtError extends Error {
  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options);

    this.name = new.target.name;
  }
}

export class TokenExpiredError extends JwtError {
  constructor(options?: ErrorOptions) {
    super('Token has expired', options);
  }
}

export class TokenInvalidError extends JwtError {
  constructor(message = 'Token is invalid', options?: ErrorOptions) {
    super(message, options);
  }
}
