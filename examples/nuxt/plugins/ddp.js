import { createClient } from '@ddp/client'

const URL = 'ws://localhost:3001/websocket'

export default (context, inject) => {
  console.log(createClient(URL))
}


// createClient(URL)
// .catch((error) => console.error(error))
// .then((client) => {
//   console.log('Finished')
// })

// client.on('articles.added', (payload) => {
//   console.log('Added', payload.id)
// })

// await client.subscribe('articles').catch(console.log)


