import type { HttpInstance } from '../../types';
import httpClient from '../http-client';
import infrastructure from './infrastructure';
import schemas from './schemas';
import indexes from './indexes';
import statuses from './statuses';
import properties from './properties';
import comments from './comments';
import documents from './documents';
import transitions from './transitions';
import { DATA_BASE } from '../../constants';
import {
  DataCommentsService,
  DataDocumentsService,
  DataIndexesService,
  DataPropertiesService,
  DataSchemaDocumentsService,
  DataSchemasService,
  DataStatusesService,
  DataTransitionsService,
} from './types';
import { mapObjIndexed } from '../../http/utils';

function partialApply(param, fn) {
  return function (...args) {
    return fn.apply(this, [param, ...args]);
  };
}

export type DataService = ReturnType<typeof infrastructure> & {
  schemas: DataSchemasService;
  indexes: DataIndexesService;
  statuses: DataStatusesService;
  properties: DataPropertiesService;
  comments: DataCommentsService;
  documents: DataDocumentsService;
  transitions: DataTransitionsService;
  schema<CustomData = null>(
    schemaId: string
  ): DataSchemaDocumentsService<CustomData>;
};

export const dataService = (httpWithAuth: HttpInstance): DataService => {
  const client = httpClient({
    basePath: DATA_BASE,
  });

  const localSchemas = schemas(client, httpWithAuth);
  const localDocuments = documents(client, httpWithAuth);

  return {
    ...infrastructure(client, httpWithAuth),
    get schemas() {
      return localSchemas;
    },
    schema(schemaId) {
      return {
        documents: mapObjIndexed(
          value => partialApply(schemaId, value),
          localDocuments
        ),
      } as any;
    },
    indexes: indexes(client, httpWithAuth),
    statuses: statuses(client, httpWithAuth),
    properties: properties(client, httpWithAuth),
    comments: comments(client, httpWithAuth),
    documents: localDocuments,
    transitions: transitions(client, httpWithAuth),
  };
};
