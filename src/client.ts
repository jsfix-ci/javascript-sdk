import {
  AuthParams,
  ClientParams,
  ParamsOauth1,
  ParamsOauth2,
  ParamsProxy,
} from './types';
import { version as packageVersion } from './version';

import {
  usersService,
  authService,
  dataService,
  tasksService,
  filesService,
  configurationsService,
  templatesService,
  mailsService,
  dispatchersService,
  paymentsService,
  localizationsService,
  profilesService,
  notificationsService,
  eventsService,
} from './services';
import {
  createHttpClient,
  createOAuth1HttpClient,
  parseAuthParams,
  createOAuth2HttpClient,
  createProxyHttpClient,
} from './http';
import { validateConfig } from './utils';
import {
  OAuthClient,
  TokenDataOauth1,
  TokenDataOauth2,
  AuthHttpClient,
  ProxyInstance,
} from './http/types';

export interface OAuth1Authenticate {
  /**
   * Use OAuth1 Token authentication
   * @example
   * await sdk.auth.authenticate({
   *  token: '',
   *  tokenSecret: '',
   * });
   * @throws {ApplicationNotAuthenticatedError}
   * @throws {AuthenticationError}
   * @throws {LoginTimeoutError}
   * @throws {LoginFreezeError}
   * @throws {TooManyFailedAttemptsError}
   * @throws {MfaRequiredError}
   */
  authenticate(oauth: {
    token: string;
    tokenSecret: string;
    skipTokenCheck?: boolean;
  }): Promise<TokenDataOauth1>;
  /**
   * Use OAuth1 Password authentication
   * @example
   * await sdk.auth.authenticate({
   *  email: '',
   *  password: '',
   * });
   * @throws {ApplicationNotAuthenticatedError}
   * @throws {AuthenticationError}
   * @throws {LoginTimeoutError}
   * @throws {LoginFreezeError}
   * @throws {TooManyFailedAttemptsError}
   * @throws {MfaRequiredError}
   */
  authenticate(oauth: {
    email: string;
    password: string;
  }): Promise<TokenDataOauth1>;
}

export interface OAuth2Authenticate {
  /**
   * Use OAuth2 Authorization Code Grant flow with callback
   * @example
   * await sdk.auth.authenticate({
   *  code: '',
   * });
   * @throws {InvalidRequestError}
   * @throws {InvalidGrantError}
   * @throws {UnsupportedGrantTypeError}
   * @throws {MfaRequiredError}
   * @throws {InvalidClientError}
   */
  authenticate(oauth: { code: string }): Promise<TokenDataOauth2>;
  /**
   * Use OAuth2 Password Grant flow
   * @example
   * await sdk.auth.authenticate({
   *  password: '',
   *  username: '',
   * });
   * @throws {InvalidRequestError}
   * @throws {InvalidGrantError}
   * @throws {UnsupportedGrantTypeError}
   * @throws {MfaRequiredError}
   * @throws {InvalidClientError}
   */
  authenticate(oauth: {
    username: string;
    password: string;
  }): Promise<TokenDataOauth2>;
  /**
   * Use OAuth2 Refresh Token Grant flow
   * @example
   * await sdk.auth.authenticate({
   *  refreshToken: '',
   * });
   * @throws {InvalidRequestError}
   * @throws {InvalidGrantError}
   * @throws {UnsupportedGrantTypeError}
   * @throws {MfaRequiredError}
   * @throws {InvalidClientError}
   */
  authenticate(oauth: { refreshToken: string }): Promise<TokenDataOauth2>;
}

type Authenticate<T extends ClientParams = ParamsOauth1> =
  T extends ParamsOauth1 ? OAuth1Authenticate : OAuth2Authenticate;

export interface Client<T extends ClientParams> {
  raw: AuthHttpClient;
  /**
   * The template service manages templates used to build emails. It can be used to retrieve, create, update or delete templates as well as resolving them.
   * @see https://swagger.extrahorizon.com/listing/?service=templates-service&redirectToVersion=1
   */
  templates: ReturnType<typeof templatesService>;
  /**
   * Provides mail functionality for other services.
   * @see https://swagger.extrahorizon.com/listing/?service=mail-service&redirectToVersion=1
   */
  mails: ReturnType<typeof mailsService>;
  /**
   * A flexible data storage for structured data. Additionally, the service enables you to configure a state machine for instances of the structured data. You can couple actions that need to be triggered by the state machine, when/as the entities (instance of structured data) change their state. Thanks to these actions you can define automation rules (see later for more in depth description). These actions also make it possible to interact with other services.
   * @see https://swagger.extrahorizon.com/listing/?service=data-service&redirectToVersion=1
   */
  data: ReturnType<typeof dataService>;
  /**
   * A service that handles file storage, metadata & file retrieval based on tokens.
   * @see https://swagger.extrahorizon.com/listing/?service=files-service&redirectToVersion=1
   */
  files: ReturnType<typeof filesService>;
  /**
   * Start functions on demand, directly or at a future moment.
   * @see https://swagger.extrahorizon.com/listing/?service=tasks-service&redirectToVersion=1
   */
  tasks: ReturnType<typeof tasksService>;
  /**
   * Provides storage for custom configuration objects. On different levels (general, groups, users, links between groups and users).
   * @see https://swagger.extrahorizon.com/listing/?service=configurations-service&redirectToVersion=2
   */
  configurations: ReturnType<typeof configurationsService>;
  /**
   * Configure actions that need to be invoked when a specific event is/was triggered.
   * @see https://swagger.extrahorizon.com/listing/?service=dispatchers-service&redirectToVersion=1
   */
  dispatchers: ReturnType<typeof dispatchersService>;
  /**
   * A service that provides payment functionality.
   * @see https://swagger.extrahorizon.com/listing/?service=payments-service&redirectToVersion=1
   */
  payments: ReturnType<typeof paymentsService>;
  /**
   * Storage and retrieval of text snippets, translated into multiple languages.
   * @see https://swagger.extrahorizon.com/listing/?service=localizations-service&redirectToVersion=1
   */
  localizations: ReturnType<typeof localizationsService>;
  /**
   * Storage service of profiles. A profile is a separate object on its own, comprising medical information like medication and medical history, as well as technical information, like what phone a user is using.
   * @see https://swagger.extrahorizon.com/listing/?service=profiles-service&redirectToVersion=1
   */
  profiles: ReturnType<typeof profilesService>;
  /**
   * A service that handles push notifications.
   * @see https://swagger.extrahorizon.com/listing/?service=notifications-service&redirectToVersion=1
   */
  notifications: ReturnType<typeof notificationsService>;
  /**
   * Service that provides event (publish/subscribe) functionality for other services.
   * @see https://swagger.extrahorizon.com/listing/?service=events-service&redirectToVersion=1
   */
  events: ReturnType<typeof eventsService>;
  /**
   * The user service stands in for managing users themselves, as well as roles related to users and groups of users.
   * @see https://swagger.extrahorizon.com/listing/?service=users-service&redirectToVersion=1
   */
  users: ReturnType<typeof usersService>;
  /**
   * Provides authentication functionality. The Authentication service supports both OAuth 1.0a and OAuth 2.0 standards.
   * @see https://swagger.extrahorizon.com/listing/?service=auth-service&redirectToVersion=2
   */
  auth: T extends ParamsOauth2
    ? ReturnType<typeof authService> &
        Pick<OAuthClient, 'confirmMfa' | 'logout'> &
        Authenticate<T>
    : T extends ParamsOauth1
    ? ReturnType<typeof authService> &
        Pick<OAuthClient, 'confirmMfa' | 'logout'> &
        Authenticate<T>
    : ReturnType<typeof authService> & Pick<ProxyInstance, 'logout'>;
}

/**
 * Create ExtraHorizon client.
 *
 * @example
 * const sdk = createClient({
 *   host: 'xxx.fibricheck.com',
 *   clientId: 'string',
 * });
 * await sdk.auth.authenticate({
 *   username: 'string',
 *   password: 'string',
 * });
 */
export function createClient<T extends ClientParams>(rawConfig: T): Client<T> {
  const config = validateConfig(rawConfig);
  const http = createHttpClient({ ...config, packageVersion });

  const httpWithAuth = ((_http, _iconfig) => {
    if ('oauth1' in _iconfig) {
      return createOAuth1HttpClient(_http, _iconfig);
    }
    if ('params' in _iconfig) {
      return createOAuth2HttpClient(_http, _iconfig);
    }

    return createProxyHttpClient(_http, _iconfig);
  })(http, config) as AuthHttpClient;

  return {
    users: usersService(httpWithAuth, http),
    data: dataService(httpWithAuth),
    files: filesService(httpWithAuth),
    tasks: tasksService(httpWithAuth),
    templates: templatesService(httpWithAuth),
    mails: mailsService(httpWithAuth),
    configurations: configurationsService(httpWithAuth),
    dispatchers: dispatchersService(httpWithAuth),
    payments: paymentsService(httpWithAuth),
    localizations: localizationsService(httpWithAuth),
    profiles: profilesService(httpWithAuth),
    notifications: notificationsService(httpWithAuth),
    events: eventsService(httpWithAuth),
    auth: ('authenticate' in httpWithAuth && httpWithAuth.authenticate
      ? {
          ...authService(httpWithAuth),
          authenticate: (oauth: AuthParams) =>
            httpWithAuth.authenticate(parseAuthParams(oauth)),
          confirmMfa: httpWithAuth.confirmMfa,
          logout: httpWithAuth.logout,
        }
      : { ...authService(httpWithAuth), logout: httpWithAuth.logout }) as any,
    raw: httpWithAuth,
  };
}

export type OAuth1Client = Client<ParamsOauth1>;
/**
 * Create ExtraHorizon OAuth1 client.
 *
 * @example
 * const sdk = createOAuth1Client({
 *   host: 'dev.fibricheck.com',
 *   consumerKey: 'string',
 *   consumerSecret: 'string',
 * });
 * await sdk.auth.authenticate({
 *   email: 'string',
 *   password: 'string',
 * });
 */
export const createOAuth1Client = (rawConfig: ParamsOauth1): OAuth1Client =>
  createClient(rawConfig);

export type OAuth2Client = Client<ParamsOauth2>;
/**
 * Create ExtraHorizon OAuth2 client.
 *
 * @example
 * const sdk = createOAuth2Client({
 *   host: 'dev.fibricheck.com',
 *   clientId: 'string',
 * });
 * await sdk.auth.authenticate({
 *   username: 'string',
 *   password: 'string',
 * });
 */
export const createOAuth2Client = (rawConfig: ParamsOauth2): OAuth2Client =>
  createClient(rawConfig);

export type ProxyClient = Client<ParamsProxy>;
/**
 * Create ExtraHorizon Proxy client.
 *
 * @example
 * const sdk = createProxyClient({
 *   host: 'apx.dev.fibricheck.com',
 * });
 */
export const createProxyClient = (rawConfig: ParamsProxy): ProxyClient =>
  createClient(rawConfig);
