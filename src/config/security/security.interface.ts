export interface SecurityConfig {
  cookie: CookieConfig;

  cors: CorsConfig;

  rateLimit: RateLimitConfig;

  csrf: CsrfConfig;
}

export interface CookieConfig {
  secret: string;

  secure: boolean;

  /**
   * `lax` is also the CSRF defence for the refresh cookie: a cross-site POST
   * carries no `lax` cookie, so a forged refresh arrives with nothing to spend.
   * It holds only while the web client shares a registrable domain with this
   * API. A move to a different domain forces `none`, and `none` needs real CSRF
   * protection first — `csrf.enabled` is a flag with nothing behind it today.
   */
  sameSite: 'lax' | 'strict' | 'none';
}

export interface CorsConfig {
  enabled: boolean;

  origin: string[];

  credentials: boolean;
}

export interface RateLimitConfig {
  enabled: boolean;
}

export interface CsrfConfig {
  enabled: boolean;
}
