import DDP from 'pubsub-client-ddp'

const URL = 'ws://localhost:3001/websocket'


export default (context, inject) => {

    console.log(DDP)
    DDP.createClient(URL)

}

