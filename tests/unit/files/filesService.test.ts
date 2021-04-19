import * as nock from 'nock';
import * as fs from 'fs';
import { AUTH_BASE, FILES_BASE } from '../../../src/constants';
import { Client, client } from '../../../src/index';
import { fileData } from '../../__helpers__/file';
import { filesResponse } from '../../__helpers__/apiResponse';

jest.mock('fs');

describe('Files Service', () => {
  const apiHost = 'https://api.xxx.fibricheck.com';
  const token = '5a0b2adc265ced65a8cab861';

  let sdk: Client;

  beforeAll(() => {
    sdk = client({
      apiHost,
      oauth: {
        clientId: '',
        username: '',
        password: '',
      },
    });

    const mockToken = 'mockToken';
    nock(apiHost)
      .post(`${AUTH_BASE}/oauth2/token`)
      .reply(200, { access_token: mockToken });
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('List all files', async () => {
    const rql = '';
    nock(`${apiHost}${FILES_BASE}`).get(`/${rql}`).reply(200, filesResponse);

    const res = await sdk.files.find(rql);

    expect(res.data.length).toBeGreaterThan(0);
  });

  it('Add a new file', async () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => ``);
    const newFile = {
      name: 'testfile',
      file: fs.readFileSync('test'),
    };

    nock(`${apiHost}${FILES_BASE}`).post('/').reply(200, fileData);

    const res = await sdk.files.createFile(newFile);
    expect(res).toBeDefined();
  });

  it('Delete a file', async () => {
    nock(`${apiHost}${FILES_BASE}`).delete(`/${token}`).reply(200);

    const res = await sdk.files.deleteFile(token);

    expect(res).toBe(true);
  });

  it('Retrieve a file', async () => {
    nock(`${apiHost}${FILES_BASE}`)
      .get(`/${token}/file`)
      .reply(200, 'some text');

    const res = await sdk.files.retrieveFile(token);

    expect(res).toBeDefined();
  });

  it('Get file details', async () => {
    nock(`${apiHost}${FILES_BASE}`)
      .get(`/${token}/details`)
      .reply(200, fileData);

    const res = await sdk.files.getFileDetails(token);

    expect(res.name).toBe(fileData.name);
  });
});