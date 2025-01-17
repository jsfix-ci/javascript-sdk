import nock from 'nock';
import { validateConfig } from '../../../src/utils';
import { AUTH_BASE } from '../../../src/constants';
import { InvalidGrantError, MfaRequiredError } from '../../../src/errors';
import { createHttpClient } from '../../../src/http/client';
import { createOAuth2HttpClient } from '../../../src/http/oauth2';
import { parseAuthParams } from '../../../src/http/utils';
import { ConfigOauth2 } from '../../../src/types';

const mockParams = {
  host: 'https://api.test.com',
  clientId: '',
};

const mockOAuth = {
  clientId: '',
  password: '',
  username: '',
};

describe('http client', () => {
  const config = validateConfig(mockParams) as ConfigOauth2;
  const http = createHttpClient({ ...config, packageVersion: '' });
  const authConfig = parseAuthParams(mockOAuth);
  let httpWithAuth: ReturnType<typeof createOAuth2HttpClient>;

  beforeEach(() => {
    nock.cleanAll();
    httpWithAuth = createOAuth2HttpClient(http, config);
  });

  it('should authorize', async () => {
    const mockToken = 'test';
    nock(mockParams.host)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, { access_token: mockToken });

    const authenticateResult = await httpWithAuth.authenticate(authConfig);
    nock(mockParams.host).get('/test').reply(200, '');

    const result = await httpWithAuth.get('test');

    expect(result.request.headers.authorization).toBe(`Bearer ${mockToken}`);
    expect(authenticateResult).toStrictEqual({ accessToken: 'test' });
  });

  it('should authorize and logout', async () => {
    const mockToken = 'test';
    nock(mockParams.host)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, { access_token: mockToken });

    await httpWithAuth.authenticate(authConfig);
    nock(mockParams.host).get('/test').reply(200, '');

    const result = httpWithAuth.logout();

    expect(result).toBe(true);
  });

  it('throws on authorization with wrong password', async () => {
    expect.assertions(1);
    nock(mockParams.host).post(`${AUTH_BASE}/oauth2/tokens`).reply(400, {
      error: 'invalid_grant',
      description: 'this password email combination is unknown',
    });

    try {
      await httpWithAuth.authenticate(authConfig);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidGrantError);
    }
  });

  it('should authorize but first reply with expired token, but then valid refresh', async () => {
    const mockToken = 'expired access token';
    nock(mockParams.host)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, { access_token: mockToken });

    await httpWithAuth.authenticate(authConfig);
    nock(mockParams.host).get('/test').reply(400, {
      code: 118,
      error: 'invalid_grant',
      description: 'the associated authorization is expired',
    });

    nock(mockParams.host)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, { access_token: 'access token' });

    nock(mockParams.host).get('/test').reply(200, {});

    const result = await httpWithAuth.get('test');

    expect(result.data).toBeDefined();
  });

  it('throws with authorization but first reply with expired token, but then fail refresh', async () => {
    expect.assertions(2);
    const mockToken = 'expired access token';
    nock(mockParams.host)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, { access_token: mockToken });

    nock(mockParams.host).post(`${AUTH_BASE}/oauth2/tokens`).reply(400, {
      error: 'invalid_grant',
      description: 'The refresh token is unknown',
    });

    nock(mockParams.host).get('/test').reply(400, {
      code: 118,
      error: 'invalid_grant',
      description: 'the associated authorization is expired',
    });

    nock(mockParams.host).get('/test').reply(200, {});

    try {
      await httpWithAuth.authenticate(authConfig);
      await httpWithAuth.get('test');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidGrantError);
      expect(error.response.error).toBe('invalid_grant');
    }
  });

  it('throws on authorization with reply twice with unknown token', async () => {
    /*  Authenticate => returns unknown access token
     *  The get call fails because 117 is returned
     *  this trigger the sdk to try and refresh the token
     *  the refresh token => returns invalid_grant
     */
    const mockToken = 'unknown access token';
    nock(mockParams.host)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, { access_token: mockToken });

    nock(mockParams.host).get('/test').reply(400, {
      code: 117,
      name: 'ACCESS_TOKEN_UNKNOWN_EXCEPTION',
      message: 'The access token is unknown',
    });

    nock(mockParams.host).post(`${AUTH_BASE}/oauth2/tokens`).reply(400, {
      error: 'invalid_grant',
      description: 'The refresh token is unknown',
    });

    try {
      await httpWithAuth.authenticate(authConfig);
      await httpWithAuth.get('test');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidGrantError);
    }
  });

  it('should authorize with a refreshToken', async () => {
    expect.assertions(2);
    const mockToken = 'access token';
    nock(mockParams.host)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, (_uri, data) => {
        expect(data).toEqual({
          client_id: '',
          grant_type: 'refresh_token',
          refresh_token: 'test',
        });

        return { access_token: mockToken };
      });

    const refreshConfig = parseAuthParams({ refreshToken: 'test' });
    await httpWithAuth.authenticate(refreshConfig);
    nock(mockParams.host).get('/test').reply(200, '');

    const result = await httpWithAuth.get('test');

    expect(result.request.headers.authorization).toBe(`Bearer ${mockToken}`);
  });

  it('should authorize with MFA Enabled', async () => {
    expect.assertions(3);
    const mockToken = 'access token';
    nock(mockParams.host)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(400, {
        error: 'mfa_required',
        description: 'Multifactor authentication is required for this user',
        mfa: {
          token: '608c038a830f40d7fe028a3f05c85b84f9040d37',
          tokenExpiresIn: 900000,
          methods: [
            {
              id: '507f191e810c19729de860ea',
              type: 'totp',
              name: 'Google Authenticator',
              tags: ['selected'],
            },
          ],
        },
      });

    nock(mockParams.host).post(`${AUTH_BASE}/oauth2/tokens`).reply(200, {
      accessToken: mockToken,
    });

    nock(mockParams.host).get('/test').reply(200, '');

    try {
      await httpWithAuth.authenticate(authConfig);
    } catch (error) {
      expect(error).toBeInstanceOf(MfaRequiredError);
      const { mfa } = error.response;
      const confirmMfaResult = await httpWithAuth.confirmMfa({
        token: mfa.token,
        methodId: mfa.methods[0].id,
        code: 'code',
      });
      const result = await httpWithAuth.get('test');
      expect(result).toBeDefined();
      expect(confirmMfaResult).toStrictEqual({ accessToken: 'access token' });
    }
  });

  it('should authorize with confidential application', async () => {
    const mockToken = 'test';
    nock(mockParams.host)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .basicAuth({ user: 'clientId', pass: 'secret' })
      .reply(200, { access_token: mockToken });

    const confidentialConfig = validateConfig({
      ...mockParams,
      clientId: 'clientId',
      clientSecret: 'secret',
    }) as ConfigOauth2;

    const confidentialHttpWithAuth = createOAuth2HttpClient(
      http,
      confidentialConfig
    );

    const authenticateResult = await confidentialHttpWithAuth.authenticate(
      authConfig
    );
    nock(mockParams.host).get('/test').reply(200, '');

    const result = await confidentialHttpWithAuth.get('test');

    expect(result.request.headers.authorization).toBe(`Bearer ${mockToken}`);
    expect(authenticateResult).toStrictEqual({ accessToken: 'test' });
  });
});
