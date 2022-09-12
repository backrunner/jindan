import { ApplicationInfo } from './app';

export interface OTPFallbackOptions {
  /**
   * Is otp fallback enabled
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
  /**
   * The token used for OTP algorithm
   */
  token: string;
  /**
   * Time period in seconds
   */
  timePeriod?: number;
}

export interface ResourceFallbackOptions {
  /**
   * The fallback domains to load static resources
   */
  domains: string[];
  /**
   * OTP fallback options
   */
  otp: OTPFallbackOptions;
}

export interface EndpointFallbackOptions {
  /**
   * The fallback endpoint URLs to load new remote config
   */
  endpoints: string[];
  /**
   * OTP fallback options
   */
  otp?: OTPFallbackOptions & { path?: string };
}

export interface FallbackOptions {
  resource: ResourceFallbackOptions;
  endpoint: EndpointFallbackOptions;
}

export interface RemoteOptions {
  /**
   * Endpoint list to request remote configuration
   */
  endpoints: string[];
  /**
   * Should get configuration from endpoints in async mode
   * If not, the configuration will be effective on the next load
   */
  async?: boolean;
  /**
   * Token for signing the request
   */
  token?: string;
  /**
   * Should request all the endpoints parallely
   */
  requestAll?: boolean;
  /**
   * Fetch options
   */
  // eslint-disable-next-line no-undef
  fetchOptions?: RequestInit;
}

export interface DatabaseOptions {
  name?: string;
}

export interface JinDanConstructorOptions {
  /**
   * Details of the fallback options
   */
  fallback: FallbackOptions;
  /**
   * Remote endpoint related options
   */
  remote: RemoteOptions;
  /**
   * Application information
   */
  appInfo: ApplicationInfo;
  /**
   * Database options
   */
  database?: DatabaseOptions;
}
