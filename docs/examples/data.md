## Find the schema with name `tests` and only select id, name and transitions

```js
const schema = await sdk.data.schemas.findByName('tests', {
  rql: rqlBuilder().select(['id', 'name', 'transitions']).build(),
});

console.log(schema.transitions);
// [{ id: '1', name:'trans1' }, { id: '1', name: 'trans2'}]

console.log(schema.transitionsByName);
/* {
  trans1: {
    id: '1',
    name: 'trans1'
  },
  trans2: {
    id: '2',
    name: 'trans2'
  }
} */
```

## Find a document with custom data typing:

```ts
const schema = await sdk.data.schemas.findFirst();

interface MyData {
  ppg: Number[];
  location: {
    longitude: Number;
    latitude: Number;
  };
}
const document = await sdk.data.documents.find<MyData>(schema.id);

console.log(document.data.ppg);
```

## Transition a document based on `data.deviceUid`

```js
const schema = await sdk.data.schemas.findByName('tests', {
  rql: rqlBuilder().select(['id', 'name', 'transitions']).build(),
});

const document = await sdk.data.documents.findFirst(schema.id, {
  rql: rqlBuilder().eq('data.deviceUid', 'testkit').build(),
});

const transitionId = schema.findTransitionIdByName('ready_to_waiting');

const transitionResult = await sdk.data.documents.transition(
  schema.id,
  document.id,
  {
    id: transitionId,
    data: { result: 'true' },
  }
);

if (transitionResult.affectedRecords === 1) {
  console.log('transition succesful');
}
```