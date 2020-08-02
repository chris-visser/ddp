import { Client } from '../../packages/client/src'


const URL = 'ws://localhost:3001/websocket';

(async () => {

    console.log('Starting app')
    const DDP = new Client(URL)

    DDP.on('error', console.error)
    DDP.on('disconnected', () => console.log('DISCONNECTED!'))
    DDP.on('reconnecting', () => console.log('RECONNECTING!'))
    DDP.on('retry', () => console.log('RETRY!'))
    DDP.on('connected', () => console.log('CONNECTED!'))

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Optional connected promise, will resolve instantly if already connected
    // Will catch if initial connection fails
    // await DDP.connected()
    //     .then(() => console.log('Initial connect success!'))
    //     .catch((error) => console.log('Initial connect error!', error))
    // DDP.disconnect()

    // DDP.connected().then(() => {
    //     console.log(DDP.connection.readyState)
    // })


    // client.on('articles.added', (payload) => {
    //   console.log('Added', payload.id)
    // })

    // await client.subscribe('articles').catch(console.log)
    console.log('Finished')

})()

