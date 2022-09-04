import { ApplicationInfo } from '../types/app';
import { EndPointConstructorOpts, EndpointResponse } from '../types/endpoint';
import { version } from '../../package.json';
import { EndpointFallbackOptions } from '../main';
import { JinDanConfigManager } from './config';
import { signRequest } from '../utils/sign';
import { Logger } from '../utils/logger';
import { composeOTPDomains } from '../utils/otp';
import { pickOneFromGroup } from '../utils/random';

/**
 * Delay amount when a request failed
 */
const FAILED_DELAY = 20 * 1000;

const logger = new Logger('Endpoint');

export class JinDanEndpoint {
  private async: boolean;
  private requestAll: boolean;
  private endpoints: string[];
  private appInfo: ApplicationInfo;
  private fallbackOptions: EndpointFallbackOptions;
  private configManager: JinDanConfigManager;
  private token?: string;

  public constructor(opts: EndPointConstructorOpts) {
    this.async = !!opts.async;
    this.requestAll = !!opts.requestAll;
    this.endpoints = opts.endpoints;
    this.appInfo = opts.appInfo;
    this.fallbackOptions = opts.fallbackOptions;
    this.configManager = opts.configManager;
    this.token = opts.token || '';
  }

  /**
   * Send request to endpoints
   * @param fetchOptions Override the default fetch options
   */
  // eslint-disable-next-line no-undef
  public async request(fetchOptions: RequestInit) {
    if (!this.async) {
      await this.requestRemote(fetchOptions);
    } else {
      // If in the async mode, request remote without await
      this.requestRemote(fetchOptions);
    }
  }

  private formatFallbackPath(path: string) {
    if (path.startsWith('/')) {
      return path.slice(1);
    }
    return path;
  }

  /**
   * Compose the endpoints which will be the target of the request.
   */
  private async composeEndpoints() {
    let res = [];
    if (this.requestAll) {
      res = this.endpoints.concat(this.fallbackOptions.endpoints);
      if (this.fallbackOptions.otp) {
        // jdc means JinDan Config
        const { path: fallbackPath = '/jdc' } = this.fallbackOptions.otp;
        res = res.concat(
          (await composeOTPDomains(this.fallbackOptions.otp)).map((domain) => {
            return `https://${domain}/${this.formatFallbackPath(fallbackPath)}`;
          }),
        );
      }
      return res;
    } else {
      // Pick one from each group
      const localGroup = this.endpoints;
      const fallbackGroup = this.fallbackOptions.endpoints;
      const otpGroup = this.fallbackOptions.otp
        ? (await composeOTPDomains(this.fallbackOptions.otp)).map((domain) => {
            const { path: fallbackPath = '/jdc' } = this.fallbackOptions.otp;
            return `https://${domain}/${this.formatFallbackPath(fallbackPath)}`;
          })
        : [];
      return [
        pickOneFromGroup<string>(localGroup),
        pickOneFromGroup<string>(fallbackGroup),
        pickOneFromGroup<string>(otpGroup),
      ];
    }
  }

  /**
   * Request remote and override the local configuration
   * @param fetchOptions Override the default fetch options
   */
  // eslint-disable-next-line no-undef
  private async requestRemote(fetchOptions: RequestInit) {
    const requests = (await this.composeEndpoints()).map((endpoint) =>
      this.createRemoteRequest(endpoint, fetchOptions),
    );
    let res;
    try {
      res = await Promise.race(requests);
    } catch (err) {
      logger.error('Request endpoints failed', err);
    }
    // No valid remote config, skip the next steps
    if (!res) {
      return;
    }
    // Set the remote config to local
    await this.configManager.setupRemoteConfig(res, !this.async);
  }

  /**
   * Create a remote request for single endpoint
   * @param endpoint Single endpoint URL, this module will request it directly and will not add anything to the URL.
   * @param fetchOptions Override the default fetch options
   * @returns Fetch Promise of requesting remote endpoint
   */
  // eslint-disable-next-line no-undef
  private async createRemoteRequest(endpoint: string, fetchOptions?: RequestInit) {
    const now = Date.now();
    const body = {
      appInfo: this.appInfo,
    };
    const res = await fetch(endpoint, {
      // Always using post rather than get to request remote endpoint
      method: 'POST',
      credentials: 'omit',
      // It will be some malicious redirecting hijack on the whole link, so we set the 'redirect' to 'error'
      redirect: 'error',
      // Only judge the domain
      referrerPolicy: 'origin',
      // Regard body as JSON
      headers: {
        'Content-Type': 'application/json',
        'X-JinDan-Version': version,
        'X-JinDan-Timestamp': `${now}`,
        'X-JinDan-Sign': await signRequest({
          body,
          timestamp: now,
          version,
          token: this.token,
        }),
      },
      // Pass application info to remote
      body: JSON.stringify(body),
    });
    if (res.status !== 200 || !res.ok) {
      return new Promise<null>((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, FAILED_DELAY);
      });
    }
    const resolved = (await res.json()) as EndpointResponse;
    if (resolved?.code !== 0) {
      return new Promise<null>((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, FAILED_DELAY);
      });
    }
    return resolved.data;
  }
}
