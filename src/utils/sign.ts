import sha256 from 'crypto-js/sha256';
import { SignRequestPayload } from 'jindan-types';

export const signRequest = (payload: SignRequestPayload) => {
  const { version, body, timestamp, token } = payload;
  const composed = `${version}_${JSON.stringify(body)}_${timestamp}_${token || 'jindan'}`;
  return sha256(composed).toString();
};
