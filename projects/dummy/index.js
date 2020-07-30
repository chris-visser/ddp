import { DDPClient } from 'pubsub-ddp-client'

const URL = 'ws://localhost:3000/websocket';

(async () => {
  const client = new DDPClient(URL)

  await client.connect()

  const items = []

  client.on('items.added', (payload) => items.push(payload))

  await client.subscribe('items').catch(console.log)

  console.log(items)
})()
