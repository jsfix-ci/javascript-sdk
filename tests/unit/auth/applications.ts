// eslint-disable-next-line import/no-extraneous-dependencies
import nock from 'nock';
import { AUTH_BASE } from '../../../src/constants';
import { Client, client, ParamsOauth2 } from '../../../src/index';
import {
  applicationDataList,
  newApplication,
  newApplicationVersion,
} from '../../__helpers__/auth';

describe('Auth - Applications', () => {
  const apiHost = 'https://api.xxx.fibricheck.com';

  let sdk: Client<ParamsOauth2>;

  beforeAll(async () => {
    sdk = client({
      apiHost,
      clientId: '',
    });

    const mockToken = 'mockToken';
    nock(apiHost)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, { access_token: mockToken });

    await sdk.auth.authenticate({
      username: '',
      password: '',
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should create an application', async () => {
    nock(`${apiHost}${AUTH_BASE}`)
      .post('/applications')
      .reply(200, newApplication);

    const createdResult = await sdk.auth.createApplication({
      type: newApplication.type,
      name: newApplication.name,
      description: newApplication.description,
    });

    expect(createdResult.id).toEqual(newApplication.id);
  });

  it('should get applications', async () => {
    nock(`${apiHost}${AUTH_BASE}`)
      .get('/applications')
      .reply(200, applicationDataList);

    const applications = await sdk.auth.getApplications();

    expect(applications.data).toBeDefined();
    expect(applications.data[0].name).toEqual(applicationDataList.data[0].name);
  });

  it('sould update an pplication', async () => {
    const mockToken = 'mockToken';
    const applicationId = '123';
    nock(apiHost)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, { access_token: mockToken });

    nock(`${apiHost}${AUTH_BASE}`)
      .put(`/applications/${applicationId}`)
      .reply(200, newApplication);

    const updatedResult = await sdk.auth.updateApplication(applicationId, {
      type: newApplication.type,
      name: newApplication.name,
      description: newApplication.description,
    });

    expect(updatedResult.id).toEqual(newApplication.id);
  });

  it('should delete an application version', async () => {
    const mockToken = 'mockToken';
    const applicationId = '123';
    const versionId = '456';
    nock(apiHost)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, { access_token: mockToken });

    nock(`${apiHost}${AUTH_BASE}`)
      .delete(`/applications/${applicationId}/${versionId}`)
      .reply(200, {
        affectedRecords: 1,
      });

    const deleteResult = await sdk.auth.deleteApplicationVersion(
      applicationId,
      versionId
    );

    expect(deleteResult.affectedRecords).toEqual(1);
  });

  it('should create an application versions', async () => {
    const mockToken = 'mockToken';
    const applicationId = '123';
    nock(apiHost)
      .post(`${AUTH_BASE}/oauth2/tokens`)
      .reply(200, { access_token: mockToken });

    nock(`${apiHost}${AUTH_BASE}`)
      .post(`/applications/${applicationId}/versions`)
      .reply(200, newApplicationVersion);

    const createdResult = await sdk.auth.createApplicationVersion(
      applicationId,
      {
        name: newApplicationVersion.name,
      }
    );

    expect(createdResult.id).toEqual(newApplicationVersion.id);
  });
});
