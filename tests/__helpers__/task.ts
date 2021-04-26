// import { FileDetails, TokenPermission } from '../../src/services/files/types';

// const token = '5a0b2adc265ced65a8cab865';
// const now = new Date();

export const taskData = {
  id: '757f191a810c19729de860ae',
  status: 'new',
  statusChangedTimestamp: '2021-04-22T14:29:45.586Z',
  functionName: 'testFunction',
  data: {
    key: 'value',
  },
  startTimestamp: '2021-04-22T14:29:45.586Z',
  tags: ['string'],
  priority: 1,
  creationTimestamp: '2021-04-22T14:29:45.586Z',
  updateTimestamp: '2021-04-22T14:29:45.586Z',
};

export const tasksResponse = {
  query: '{}',
  page: {
    total: 1,
    offset: 0,
    limit: 20,
  },
  data: [taskData],
};