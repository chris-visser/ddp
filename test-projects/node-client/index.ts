import DDP from 'pubsub-client-ddp';

const URL = 'ws://localhost:3001/websocket';

(async () => {

    console.log('Starting app')
    const Client = DDP.createClient(URL)

    Client.on('error', console.error)
    Client.on('disconnected', () => console.log('DISCONNECTED!'))
    Client.on('reconnecting', () => console.log('RECONNECTING!'))
    Client.on('retry', () => console.log('RETRY!'))
    Client.on('connected', () => console.log('CONNECTED!'))

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Optional connected promise, will resolve instantly if already connected
    // Will catch if initial connection fails
    // await Client.connected()
    //     .then(() => console.log('Initial connect success!'))
    //     .catch((error) => console.log('Initial connect error!', error))
    // Client.disconnect()

    // Client.connected().then(() => {
    //     console.log(DDP.connection.readyState)
    // })


    // client.on('articles.added', (payload) => {
    //   console.log('Added', payload.id)
    // })

    // await client.subscribe('articles').catch(console.log)
    console.log('Finished')

})()

