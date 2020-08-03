# @ddp/client

> Do not use this library yet. Its work in progress. Feel free to test it and provide feedback :) 
> The `publication`, `call` and `apply` methods have not yet been finished too and the package 
> has not yet been published to NPM, because the name will likely change.

A modern isomorphic DDP client with optional Promise based API for easy pub/sub integration 
on any client. 

## Features

- Retries on first attempt
- Auto reconnect with backoff policy on disconnect 
- Event emitter for any plugins or 3th party libraries
- Optional Promise based API for synchronous flows
- Typescript support

## Getting Started

```bash
npm i @ddp/client
```
or
```bash
yarn @ddp/client
```

Initialize the client and start subscribing!

```js
import DDP from '@ddp/client';

const URL = 'ws://localhost:3001/websocket';

const Client = new DDP.createClient(URL) // Starts connection

Client.subscribe('{publication}', params) // Subscribes to publication
Client.call('{method}', params) // Calls a DDP method on the server
```

### Using promises

```js
(async () => {
  const Client = new DDP.createClient(URL)

  // Resolves when the socket has been established and the DDP connect message was sent
  await Client.connected() 

  // Subscriptions return a subId, but are not promised based to allow non-blocking 
  // scenarios. During SSR, you might want to wait for the subscription to go into a 
  // "ready" state, meaning the initial data has been sent back to the client.
  // 
  // Adding `.ready()` returns a promise with the subId. It resolves when the subscription is ready
  const subId = await Client.subscribe('{subscription}', params).ready()

  // Similar to the subscription's `.ready()`, `.done()` could be used for methods 
  // to return results synchroneously similar to how for example the 
  // [Axios](https://github.com/axios/axios) library handles normal http requests
  const result = await Client.call('{method}', params).done()
})()
```

### Listening to events

```js
Client.on('error', (error) => handler(error))
Client.on('disconnected', handler)
Client.on('reconnecting', handler)
Client.on('retry', handler)
Client.on('connected', ({ sessionId }) => handler(sessionId))
```

The events are listed in the typescript `EventName` enum:

```ts
import { EventName } from '@ddp/client/enums';

Client.on(EventName.Connected, handler)
```

### Example for SSR scenarios:

```js
const getArticles = async (DDP, params) => {
  
  const articles = []

  Client.on(`articles.added`, ({ id, fields }) => {
    articles.push({ id, ...fields })
  })

  await Client.subscribe('articles', params).ready()

  return articles
}

app.route('*', async (req, res) => {
  // Start a connection per request. Because a DDP connection contains 
  // a session token per client / user
  const Client = new DDP.createClient(URL) 

  const articles = await getArticles(DDP, req.query)

  Client.disconnect() // Close connection

  // ... hydration code for your specific UI library or framework
})
```
