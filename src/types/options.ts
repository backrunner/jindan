export interface OTPFallbackOptions {
  /**
   * Should OTP fallback enabled
   */
  enabled: boolean;
  /**
   * Whether the top domain will be a randomized string
   */
  fullyRandom: boolean;
  /**
   * If fullyRandom disabled, base domain is the top domain like .top, .xyz
   * If fullyRandom enabled, base domain will be something like abc.top, abc.xyz
   */
  baseDomains: string | string[];
}

export interface FallbackOptions {
  /**
   * The fallback domains to load static resources
   */
  domains: string[];
  /**
   * OTP fallback options
   */
  otp: OTPFallbackOptions;
}

export interface JinDanConstructorOptions {
  /**
   * Endpoint list to request remote configuration
   */
  endpoints: string[];
  /**
   * Details of the fallback options
   */
  fallback: FallbackOptions;
  /**
   * Should get configuration from endpoints in async mode
   * If not, the configuration will be effective on the next load
   */
  async?: boolean;
}
