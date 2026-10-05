export interface WebullCredentials {
  appKey: string;
  appSecret: string;
  token: string;
  host: string;
}

export interface WebullRequestOptions {
  method: 'GET' | 'POST';
  uri: string;
  queries?: Record<string, string>;
  body?: Record<string, any>;
  credentials?: Partial<WebullCredentials>;
}

export function rfc3986Quote(str: string): string;
export function getWebullCredentials(): WebullCredentials;
export function buildSignedHeaders(
  host: string,
  uri: string,
  queries?: Record<string, string>,
  body?: Record<string, any>,
  appKey?: string,
  appSecret?: string,
  token?: string
): Record<string, string>;
export function executeWebullRequest<T = any>(options: WebullRequestOptions): Promise<T>;
