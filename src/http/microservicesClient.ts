/* eslint-disable no-underscore-dangle */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { MicroservicesConfig } from '../types';
import { MfaConfig, OAuth2Config, OAuthClient, TokenDataOauth2 } from './types';
import {
  camelizeResponseData,
  transformKeysResponseData,
  transformResponseData,
  useHostFromServiceDiscovery,
} from './interceptors';
import { typeReceivedError } from '../errorHandler';

export function createMicroservicesHttpClient(
  http: AxiosInstance,
  options: MicroservicesConfig
): OAuthClient {
  let tokenData: TokenDataOauth2;
  let authConfig: OAuth2Config;
  const httpWithAuth = axios.create({ ...http.defaults });

  const { requestLogger, responseLogger } = options;
  if (requestLogger) {
    httpWithAuth.interceptors.request.use(
      config => {
        requestLogger(config);
        return config;
      },
      error => {
        requestLogger(error);
        return Promise.reject(error);
      }
    );
  }

  if (responseLogger) {
    httpWithAuth.interceptors.response.use(
      response => {
        responseLogger(response);
        return response;
      },
      error => {
        responseLogger(error);
        return Promise.reject(error);
      }
    );
  }

  const refreshTokens = async () => {
    const tokenResult = await http.post(options.path, {
      grant_type: 'refresh_token',
      refresh_token: tokenData.refreshToken,
    });
    setTokenData(tokenResult.data);
    return tokenResult.data;
  };

  httpWithAuth.interceptors.request.use(async config => ({
    ...config,
    headers: {
      ...config.headers,
      ...(tokenData && tokenData.accessToken
        ? { Authorization: `Bearer ${tokenData.accessToken}` }
        : {}),
    },
  }));

  httpWithAuth.interceptors.response.use(
    (response: AxiosResponse) => response,
    async error => {
      // Only needed if it's an axiosError, otherwise it's already typed
      if (error && error.isAxiosError) {
        const originalRequest = error.config;
        if (
          error.response &&
          [400, 401, 403].includes(error.response.status) &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          if (
            error.response?.data?.code === 118 ||
            // ACCESS_TOKEN_EXPIRED_EXCEPTION
            error.response?.data?.code === 117
            // ACCESS_TOKEN_UNKNOWN
          ) {
            tokenData.accessToken = '';
            originalRequest.headers.Authorization = `Bearer ${
              (await refreshTokens()).accessToken
            }`;
          } else {
            return Promise.reject(typeReceivedError(error));
          }
          return http(originalRequest);
        }

        return Promise.reject(typeReceivedError(error));
      }
      return Promise.reject(error);
    }
  );

  httpWithAuth.interceptors.request.use(
    useHostFromServiceDiscovery(options.serviceUrlFn)
  );
  httpWithAuth.interceptors.response.use(camelizeResponseData);
  httpWithAuth.interceptors.response.use(transformResponseData);
  httpWithAuth.interceptors.response.use(transformKeysResponseData);

  async function setTokenData(data: TokenDataOauth2) {
    if (options.freshTokensCallback) {
      await options.freshTokensCallback(data);
    }
    tokenData = data;
  }

  async function authenticate(data: OAuth2Config): Promise<void> {
    authConfig = data;
    const tokenResult = await http.post(options.path, {
      ...options.params,
      ...authConfig.params,
    });
    setTokenData(tokenResult.data);
  }

  async function confirmMfa({
    token,
    methodId,
    code,
  }: MfaConfig): Promise<void> {
    const tokenResult = await http.post(options.path, {
      ...options.params,
      ...authConfig.params,
      grant_type: 'mfa',
      token,
      code,
      method_id: methodId,
    });
    setTokenData(tokenResult.data);
  }

  return {
    ...httpWithAuth,
    authenticate,
    confirmMfa,
    get userId() {
      return tokenData?.userId;
    },
  };
}
