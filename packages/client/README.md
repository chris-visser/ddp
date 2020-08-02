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
import { Client } from '@ddp/client';

const URL = 'ws://localhost:3001/websocket';

const DDP = new Client(URL) // Starts connection

DDP.subscribe('{publication}', params) // Subscribes to publication
DDP.call('{method}', params) // Calls a DDP method on the server
```

### Using promises

```js
(async () => {
  const DDP = new Client(URL)

  // Resolves when the socket has been established and the DDP connect message was sent
  await DDP.connected() 

  // Subscriptions return a subId, but are not promised based to allow non-blocking 
  // scenarios. During SSR, you might want to wait for the subscription to go into a 
  // "ready" state, meaning the initial data has been sent back to the client.
  // 
  // Adding `.ready()` returns a promise with the subId. It resolves when the subscription is ready
  const subId = await DDP.subscribe('{subscription}', params).ready()

  // Similar to the subscription's `.ready()`, `.done()` could be used for methods 
  // to return results synchroneously similar to how for example the 
  // [Axios](https://github.com/axios/axios) library handles normal http requests
  const result = await DDP.call('{method}', params).done()
})()
```

### Listening to events

```js
DDP.on('error', (error) => handler(error))
DDP.on('disconnected', handler)
DDP.on('reconnecting', handler)
DDP.on('retry', handler)
DDP.on('connected', ({ sessionId }) => handler(sessionId))
```

The events are listed in the typescript `EventName` enum:

```ts
import { EventName } from '@ddp/client/enums';

DDP.on(EventName.Connected, handler)
```

### Example for SSR scenarios:

```js
const getArticles = async (DDP, params) => {
  
  const articles = []

  DDP.on(`articles.added`, ({ id, fields }) => {
    articles.push({ id, ...fields })
  })

  await DDP.subscribe('articles', params).ready()

  return articles
}

app.route('*', async (req, res) => {
  // Start a connection per request. Because a DDP connection contains 
  // a session token per client / user
  const DDP = new Client(URL) 

  const articles = await getArticles(DDP, req.query)

  DDP.disconnect() // Close connection

  // ... hydration code for your specific UI library or framework
})
```
