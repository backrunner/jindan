export interface SignRequestPayload {
  body: object;
  timestamp: number;
  version: string;
  token?: string;
}
