import nock from 'nock';
import { AUTH_BASE, LOCALIZATIONS_BASE } from '../../../src/constants';
import { Client, createClient, ParamsOauth2 } from '../../../src/index';
import { languagesResponse } from '../../__helpers__/localization';

describe('Languages Service', () => {
  const host = 'https://api.xxx.fibricheck.com';

  let sdk: Client<ParamsOauth2>;

  beforeAll(async () => {
    sdk = createClient({
      host,
      clientId: '',
    });

    const mockToken = 'mockToken';
    nock(host)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, { access_token: mockToken });

    await sdk.auth.authenticate({
      username: '',
      password: '',
    });
  });

  it('should retrieve a list of all the defined languages', async () => {
    nock(`${host}${LOCALIZATIONS_BASE}`)
      .get('/languages')
      .reply(200, languagesResponse);

    const res = await sdk.localizations.getLanguages();

    expect(res.length).toBeGreaterThan(0);
  });
});
