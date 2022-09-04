import { Sha256 } from '@aws-crypto/sha256-browser';
import { SignRequestPayload } from '../types/sign';
import { uint8ToBase64 } from './string';

export const signRequest = async (payload: SignRequestPayload) => {
  const { version, body, timestamp, token } = payload;
  const composed = `${version}_${JSON.stringify(body)}_${timestamp}_${token || 'jindan'}`;
  const hash = new Sha256();
  hash.update(composed);
  return uint8ToBase64(await hash.digest());
};
