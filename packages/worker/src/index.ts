/* eslint-disable no-undef */
export interface Env {
  jindan: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {},
};
