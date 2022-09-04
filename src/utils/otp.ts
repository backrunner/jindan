import { Sha256 } from '@aws-crypto/sha256-browser';
import { OTPFallbackOptions } from '../main';
import { uint8ToHexString } from './string';

const A_DAY_IN_SECONDS = 24 * 60 * 60;

const formatBaseDomain = (domain: string) => {
  if (domain.startsWith('.')) {
    return domain.slice(1);
  }
  return domain;
};

/**
 * Generate domain list based on time and hash
 * @param options OTP fallback options
 * @returns composed domain list
 */
export const composeOTPDomains = async (options: OTPFallbackOptions) => {
  const { fullyRandom, baseDomains, token, timePeriod = A_DAY_IN_SECONDS } = options;
  const currentPeriod = Math.floor(Date.now() / (timePeriod * 1000));
  const domainList = Array.isArray(baseDomains) ? baseDomains : [baseDomains];
  if (fullyRandom) {
    const subHashPaylod = `jindan_sub_${currentPeriod}_${token}`;
    const hashPayload = `jindan_${currentPeriod}_${token}`;
    const hash = new Sha256();
    const subHash = new Sha256();
    hash.update(hashPayload);
    subHash.update(subHashPaylod);
    const topDomain = uint8ToHexString(await hash.digest()).slice(0, 16);
    const subDomain = uint8ToHexString(await subHash.digest()).slice(0, 12);
    return domainList.map((domain) => `${subDomain}.${topDomain}.${formatBaseDomain(domain)}`);
  } else {
    const hashPayload = `jindan_${timePeriod}_${token}`;
    const hash = new Sha256();
    hash.update(hashPayload);
    const subDomain = uint8ToHexString(await hash.digest()).slice(0, 12);
    return domainList.map((domain) => `${subDomain}.${formatBaseDomain(domain)}`);
  }
};
