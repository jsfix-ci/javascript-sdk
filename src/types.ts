import { AxiosResponse } from 'axios';
import * as OAuth from 'oauth-1.0a';
import { TokenDataOauth2, HttpRequestConfig } from './http/types';

export * from './http/types';
export * from './services/types';
export * from './services/auth/types';
export * from './services/data/types';
export * from './services/files/types';
export * from './services/tasks/types';
export * from './services/users/types';
export * from './services/mails/types';
export * from './services/templates/types';
export * from './services/configurations/types';
export * from './services/dispatchers/types';
export * from './services/payments/types';
export * from './services/localizations/types';
export * from './services/profiles/types';
export * from './services/notifications/types';
export * from './services/events/types';

export interface ParamsOauth1WithEmail {
  email: string;
  password: string;
}

export interface ParamsOauth1WithToken {
  token: string;
  tokenSecret: string;
  skipTokenCheck?: boolean;
}

export interface ParamsOauth2AuthorizationCode {
  code: string;
}

export interface ParamsOauth2Password {
  username: string;
  password: string;
}

export interface ParamsOauth2Refresh {
  refreshToken: string;
}

export type AuthParams =
  | ParamsOauth1WithEmail
  | ParamsOauth1WithToken
  | ParamsOauth2AuthorizationCode
  | ParamsOauth2Password
  | ParamsOauth2Refresh;

interface ParamsBase {
  host: string;
  responseLogger?: (response: AxiosResponse | Error) => unknown;
  requestLogger?: (request: HttpRequestConfig | Error) => unknown;
  headers?: {
    'X-Request-Service'?: string;
    'X-Forwarded-Application'?: string;
    'X-Forwarded-User'?: string;
  };
}

export interface ParamsOauth1 extends ParamsBase {
  consumerKey: string;
  consumerSecret: string;
}

export interface ParamsOauth2 extends ParamsBase {
  clientId: string;
  clientSecret?: string;
  freshTokensCallback?: (tokenData: TokenDataOauth2) => void;
}

export type ParamsProxy = ParamsBase;

interface HttpClientBase {
  packageVersion: string;
}

export interface ConfigOauth1 extends ParamsBase {
  path: string;
  oauth1: OAuth;
}

export interface ConfigOauth2 extends ParamsBase {
  path: string;
  params: {
    client_id: string;

    client_secret?: string;
  };
  freshTokensCallback?: (tokenData: TokenDataOauth2) => void;
}

export type ConfigProxy = ParamsBase;

export type ClientParams = ParamsOauth1 | ParamsOauth2 | ParamsProxy;
export type ClientConfig = ConfigOauth1 | ConfigOauth2 | ConfigProxy;
export type HttpClientConfig = HttpClientBase & ClientConfig;
