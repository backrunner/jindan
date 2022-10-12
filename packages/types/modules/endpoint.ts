import { JinDanConfig } from './config';
export interface EndpointResponse {
  code: number;
  message?: string;
  data: Partial<JinDanConfig>;
}
