# `pubsub-ddp-client`

> Do not use this library yet. Its work in progress. Even the name will likely change

A modern isomorphic DDP client for easy pub/sub integration on the site. 

This client features

- Serverside Rendering
- Promise and async/await based methods
- An event emitter to listen for incoming messages

## Usage

```bash
npm i pubsub-ddp-client
```
or
```bash
yarn pubsub-ddp-client
```

On either the server or browser:

```
import DDPClient from 'pubsub-ddp-client';

const URL = 'ws://localhost:3001/websocket';

(async () => {
  const client = new DDPClient(URL)

  await client.connect()

  const items = []

  client.on('items.added', (payload) => items.push(payload))

  await client.subscribe('items')

  console.log(items)
})()

```
