import { AxiosResponse } from 'axios';
import { DATA_BASE } from '../constants';
import { camelizeKeys, recursiveMap, recursiveRenameKeys } from './utils';

export const camelizeResponseData = ({
  data,
  config,
  ...response
}: AxiosResponse): AxiosResponse => ({
  ...response,
  config,
  data:
    // Note: the /data endpoint can return custom properties that the user has defined
    config.url.startsWith(DATA_BASE) ||
    ['arraybuffer', 'stream'].includes(config.responseType)
      ? data
      : camelizeKeys(data),
});

const mapDateValues = (value, key) => {
  if (
    [
      'creationTimestamp',
      'expiryTimestamp',
      'updateTimestamp',
      'lastFailedTimestamp',
      'statusChangedTimestamp',
      'startTimestamp',
      'timestamp',
    ].includes(key)
  ) {
    return new Date(value);
  }
  return value;
};

export const transformResponseData = ({
  data,
  config,
  ...response
}: AxiosResponse): AxiosResponse => ({
  ...response,
  config,
  data: ['arraybuffer', 'stream'].includes(config.responseType)
    ? data
    : recursiveMap(mapDateValues)(data),
});

const convertRecordsAffectedKeys = key => {
  if (['records_affected', 'recordsAffected'].includes(key)) {
    return 'affectedRecords';
  }
  return key;
};

export const transformKeysResponseData = ({
  data,
  config,
  ...response
}: AxiosResponse): AxiosResponse => ({
  ...response,
  config,
  data: ['arraybuffer', 'stream'].includes(config.responseType)
    ? data
    : recursiveRenameKeys(convertRecordsAffectedKeys, data),
});