import DDPClient from '@ddp/client';

const URL = 'ws://localhost:3001/websocket';

(async () => {
  const client = new DDPClient(URL)

  await client.connect()

  const items = []

  client.on('items.added', (payload) => items.push(payload))

  await client.subscribe('items')

  console.log(items)
})()
