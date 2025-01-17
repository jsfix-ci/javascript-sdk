import nock from 'nock';
import * as fs from 'fs';
import { AUTH_BASE, FILES_BASE } from '../../../src/constants';
import {
  Client,
  createClient,
  ParamsOauth2,
  rqlBuilder,
} from '../../../src/index';
import { fileData } from '../../__helpers__/file';
import { createPagedResponse } from '../../__helpers__/utils';

jest.mock('fs');

describe('Files Service', () => {
  const host = 'https://api.xxx.fibricheck.com';
  const token = '5a0b2adc265ced65a8cab861';

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

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('should list all files', async () => {
    const rql = rqlBuilder().build();
    nock(`${host}${FILES_BASE}`)
      .get(`/${rql}`)
      .reply(200, createPagedResponse(fileData));

    const res = await sdk.files.find({ rql });

    expect(res.data.length).toBeGreaterThan(0);
  });

  it('should find a file by name', async () => {
    const { name } = fileData;
    nock(`${host}${FILES_BASE}`)
      .get(`/?eq(name,${name})`)
      .reply(200, createPagedResponse(fileData));

    const file = await sdk.files.findByName(name);

    expect(file.name).toBe(name);
  });

  it('should find the first file', async () => {
    nock(`${host}${FILES_BASE}`)
      .get('/')
      .reply(200, createPagedResponse(fileData));

    const file = await sdk.files.findFirst();

    expect(file.name).toBe(fileData.name);
  });

  it('should add a new file', async () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => ``);
    const newFile = {
      name: 'testfile',
      file: fs.readFileSync('test'),
      extension: 'pdf',
    };

    nock(`${host}${FILES_BASE}`).post('/').reply(200, fileData);

    const res = await sdk.files.create(newFile.name, newFile.file);
    expect(res).toBeDefined();
  });

  it('should add a new file from text', async () => {
    nock(`${host}${FILES_BASE}`).post('/').reply(200, fileData);

    const res = await sdk.files.createFromText('testfilestring');
    expect(res).toBeDefined();
  });

  it('should delete a file', async () => {
    nock(`${host}${FILES_BASE}`).delete(`/${token}`).reply(200);

    const res = await sdk.files.remove(token);

    expect(res.affectedRecords).toBe(1);
  });

  it('should retrieve a file', async () => {
    nock(`${host}${FILES_BASE}`).get(`/${token}/file`).reply(200, 'some text');

    const res = await sdk.files.retrieve(token);

    expect(res).toBeDefined();
  });

  it('should get file details', async () => {
    nock(`${host}${FILES_BASE}`).get(`/${token}/details`).reply(200, fileData);

    const res = await sdk.files.getDetails(token);

    expect(res.name).toBe(fileData.name);
  });
});
