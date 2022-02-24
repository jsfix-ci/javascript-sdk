# Axios

When you initialize the SDK we create two Axios instances. One is unauthenticated and is used to authenticate, refresh tokens and call to public endpoints like `/health`. The other is for authenticated calls.

## Authentication

There are three types of authenticated Axios clients in the SDK. We use Axios interceptors to handle this https://axios-http.com/docs/interceptors. The access_token will be added on each request.

```ts
httpWithAuth.interceptors.request.use(async (config) => ({
  ...config,
  headers: {
    ...config.headers,
    ...(tokenData && tokenData.accessToken
      ? { Authorization: `Bearer ${tokenData.accessToken}` }
      : {}),
  },
}));
```

### OAuth1

We use https://www.npmjs.com/package/oauth-1.0a package to handle the OAuth1 specifics (generate OAuth request data and parsing it as a header)

```ts
httpWithAuth.interceptors.request.use(async (config = {}) => ({
  ...config,
  headers: {
    ...config.headers,
    "Content-Type": "application/json",
    ...(config?.method
      ? options.oauth1.toHeader(
          options.oauth1.authorize(
            {
              url: `${config.baseURL}${config.url}`,
              method: config.method,
            },
            tokenData
          )
        )
      : {}),
  },
}));
```

### OAuth2

Has an interceptor to handle token refreshes, when the backend replies with the expired tokens code.

```
const refreshTokens = async () => {
  const tokenResult = await http.post(options.path, {
    grant_type: 'refresh_token',
    refresh_token: tokenData.refreshToken,
  });
  await setTokenData(tokenResult.data);
  return tokenResult.data;
};

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

```

### Proxy

Enables the `withCredentials` flag in the Axios instance.

```ts
// `withCredentials` indicates whether or not cross-site Access-Control requests
// should be made using credentials
```

More info: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials

## Errors

When the server responds with a response status >200, we cast the response to a typed error instance based on the response status. ie `129: MfaRequiredError`. All the errors are extended from the base `ApiError` class which parses the Axios response to a human readable format.

```ts
export function typeReceivedError(error: HttpError) {
  const ErrorClassDefinition =
    ErrorClassDefinitionsMap[error?.response?.data?.code];

  if (ErrorClassDefinition) {
    return ErrorClassDefinition.createFromHttpError(error);
  }

  const ErrorClassDefinitionByCode =
    ErrorClassDefinitionsByErrorMap[error?.response?.data?.error];

  if (ErrorClassDefinitionByCode) {
    return ErrorClassDefinitionByCode.createFromHttpError(error);
  }

  return ApiError.createFromHttpError(error);
}
```

More info: https://github.com/ExtraHorizon/javascript-sdk/blob/24e476066db87757fd0da5be14d4df35ff8233ce/src/errorHandler.ts

This is how the interceptor look in the OAuth1 client.

```ts
httpWithAuth.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    // Only needed if it's an axiosError, otherwise it's already typed
    if (error && error.isAxiosError) {
      return Promise.reject(typeReceivedError(error));
    }
    return Promise.reject(error);
  }
);
```

## Retry interceptor

Every response goes throught en retry interceptor, checking whether it should retry on certain conditions.

```ts
export const retryInterceptor =
  (axios: AxiosInstance) =>
  async (error: HttpResponseError): Promise<unknown> => {
    const { config } = error;
    const { retry } = config;

    // tries includes the initial try. So 5 tries equals 4 retries
    if (
      error?.isAxiosError &&
      retry?.tries > retry?.current &&
      retry?.retryCondition(error)
    ) {
      await delay(retry.retryTimeInMs);

      return axios({
        ...config,
        retry: {
          ...retry,
          current: retry.current + 1,
        },
      } as AxiosRequestConfig);
    }

    return Promise.reject(error);
  };

httpWithAuth.interceptors.response.use(null, retryInterceptor(httpWithAuth));
```

The default behaviour. Requests will be retried 5 times at 300 ms intervals when the backend responds with 5xx.

```ts
const defaultRetryConfig = {
  tries: 5,
  retryTimeInMs: 300,
  current: 1,
  retryCondition: (error: HttpResponseError) => {
    try {
      if (error.response?.status >= 500 && error.response?.status <= 599) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
};
```

## Other interceptors

There are three skippable data massaging interceptors.

```ts
httpWithAuth.interceptors.response.use(camelizeResponseData);
httpWithAuth.interceptors.response.use(transformResponseData);
httpWithAuth.interceptors.response.use(transformKeysResponseData);
```

- camelizeResponseData

Will camelCase all the keys in the response

```ts
export const camelizeResponseData = ({
  data,
  config,
  ...response
}: HttpResponse): HttpResponse => ({
  ...response,
  config,
  data:
    // Note: the /data endpoint can return custom properties that the user has defined
    config?.url?.startsWith(DATA_BASE) ||
    ["arraybuffer", "stream"].includes(config.responseType ?? "") ||
    config?.interceptors?.skipCamelizeResponseData
      ? data
      : camelizeKeys(data),
});
```

- transformResponseData

Will try to recursively map timestamps to JavaScript Dates for easier usage.

```ts
export const transformResponseData = ({
  data,
  config,
  ...response
}: HttpResponse): HttpResponse => ({
  ...response,
  config,
  data:
    ["arraybuffer", "stream"].includes(config?.responseType ?? "") ||
    config?.interceptors?.skipTransformResponseData
      ? data
      : recursiveMap(mapDateValues, config?.url?.startsWith(DATA_BASE))(data),
});
```

- transformKeysResponseData

Will map certains keys so that the responses are more consistent.

```ts
const convertRecordsAffectedKeys = (key) => {
  if (["records_affected", "recordsAffected"].includes(key)) {
    return "affectedRecords";
  }
  return key;
};

export const transformKeysResponseData = ({
  data,
  config,
  ...response
}: HttpResponse): HttpResponse => ({
  ...response,
  config,
  data:
    ["arraybuffer", "stream"].includes(config?.responseType ?? "") ||
    config?.interceptors?.skipTransformKeysResponseData
      ? data
      : recursiveRenameKeys(convertRecordsAffectedKeys, data),
});
```
