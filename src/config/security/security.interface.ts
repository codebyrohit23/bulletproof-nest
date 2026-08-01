export interface SecurityConfig {
  cookie: CookieConfig;

  cors: CorsConfig;

  rateLimit: RateLimitConfig;

  csrf: CsrfConfig;
}

export interface CookieConfig {
  secret: string;
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
