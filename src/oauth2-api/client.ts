/* eslint-disable camelcase */
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AUTH_BASE, BASE_URL, CLIENT_ID, HEALTH_ENDPOINT, USER_BASE } from './constants';

const Errors = {
  INVALID_CLIENT: 'invalid_client',
  INVALID_GRANT: 'invalid_grant',
  CONNECTION_ABORTED: 'ECONNABORTED',
} as const;

export const errorLogger = async (error: AxiosError) => {
  // Log every error that has no 200 status
  console.log(JSON.stringify(error));
  if (error.response?.status !== 200) {
    const errorMessage = {
      ...error.response?.data,
      baseURL: error.config?.baseURL,
      url: error.config?.url,
      method: error.config?.method,
    };

    // don't log token errors
    // TODO Fix refresh token logic
    if (errorMessage.error === Errors.INVALID_GRANT) {
      return Promise.reject(error);
    }
  }

  return Promise.reject(error);
};

const createAxiosInstance = () => axios.create({
  baseURL: BASE_URL,
  responseType: 'json',
  validateStatus: (status: number) => status >= 200 && status < 400,
});

export const withoutTokenInterceptors = (client: AxiosInstance) => {
  // client.interceptors.response.use(res => res, handleNetworkError);
  // client.interceptors.response.use(res => res, checkMandatoryUpdateError);
  client.interceptors.response.use(res => res, errorLogger);

  return client;
};

export const addAuthHeaderInterceptor = async (config: AxiosRequestConfig) => {
  // const tokens = await retrieveTokens();
  const tokens = await authenticate('*****', '*****');
  if (tokens?.access_token && !config?.headers?.Authorization) {
    // eslint-disable-next-line no-param-reassign
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    };
  }
  return config;
};

export const withTokenInterceptors = (client: AxiosInstance, _axiosWithoutToken: AxiosInstance) => {
  client.interceptors.request.use(addAuthHeaderInterceptor);
  // client.interceptors.response.use(res => res, handleNetworkError);
  // client.interceptors.response.use(res => res, refreshTokenInterceptor(axiosWithoutToken));
  // client.interceptors.response.use(res => res, checkMandatoryUpdateError);
  client.interceptors.response.use(res => res, errorLogger);

  return client;
};
export const axiosWithoutToken = withoutTokenInterceptors(
  createAxiosInstance()
);

export const axiosWithToken = withTokenInterceptors(createAxiosInstance(), axiosWithoutToken);

export async function fetchHealthCheck() {
  try {
    await axiosWithoutToken.get(HEALTH_ENDPOINT);
    return true;
  } catch {
    return false;
  }
}

export async function authenticate(username:string, password:string) {
  const response: AxiosResponse<TokenResponse> = await axiosWithoutToken.post(`${AUTH_BASE}/oauth2/token`, {
    grant_type: 'password',
    client_id: CLIENT_ID,
    username,
    password,
  });
  return response.data;
}

export async function fetchUserDetails() {
  const { data } = await axiosWithToken.get(`${USER_BASE}/me`);
  return data;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  application_id: string;
  user_id: string;
  expires_in: number;
  token_type: string;
}
