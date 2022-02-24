## New service

### Books

Let's say you want to add a new service. `api.fibricheck.com/books/v1/`

- Create a new folder `books` under `src/services`
- Add three files. `index.ts`, `types.ts` and `books.ts`

#### Types.ts

Each service has a types definition specifying the structure of the service. For the books service this might look like this.

```ts
// These are shared types
export type Headers = Record<string, string>;

export type OptionsBase = {
  /** Added to all HTTP verbs */
  headers?: Headers;
  /** Only passed to the GET requests. Will retry 4 times on 500 errors */
  shouldRetry?: boolean;
};

export type OptionsWithRql = OptionsBase & { rql?: RQLString };

export interface PagedResult<T> {
  page: {
    total: number;
    offset: number;
    limit: number;
  };
  data: T[];
}

export interface Book {
  id: ObjectId;
  author: string;
  isbn: string;
}

export interface BooksService {
  /**
   * View a list of books
   *
   * Permission | Scope | Effect
   * - | - | -
   * @returns PagedResult<Book>
   */
  find(options?: OptionsWithRql): Promise<PagedResult<Book>>;
}
```

#### Books.ts

Contains the implementation of the `BooksService`

```ts
import type { HttpInstance } from "../../types";
import type { BooksService } from "./types";
import { HttpClient } from "../http-client";

export default (client: HttpClient, httpAuth: HttpInstance): BooksService => ({
  async find(options) {
    return (await client.get(httpAuth, `/${options?.rql || ""}`, options)).data;
  },
});
```

#### Index.ts

This file hooks the different subservices to the books namespace.

```ts
import type { HttpInstance } from "../../types";
import httpClient from "../http-client";
import books from "./books";
import { BOOKS_BASE } from "../../constants";
import { BooksService } from "./types";

export const booksService = (httpWithAuth: HttpInstance): BooksService => {
  const client = httpClient({
    basePath: BOOKS_BASE,
  });

  const booksMethods = books(client, httpWithAuth);

  return {
    ...booksMethods,
  };
};
```

### Other changes

- Under `services/index.ts` add the line

```ts
export * from "./books";
```

- Under `client.ts`

```ts
import {
  booksService,
  // ...
} from "./services";

export interface Client<T extends ClientParams> {
  // ...
  /**
   * Get information about books.
   * @see https://developers.extrahorizon.io/services/?service=books-service&redirectToVersion=1
  */
  books: ReturnType<typeof booksService>;
  // ...
}

export function createClient<T extends ClientParams>(rawConfig: T): Client<T> {
  /*
  ...
  */

  return {
    // ...
    books: booksService(httpWithAuth),
    // ...
  };
```

You `find` function should now be exposed under `sdk.books.find`.
