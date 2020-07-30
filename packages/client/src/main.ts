import { Client } from './client'

export const createClient = async (URL) => {
    const client = new Client(URL)

    await client.connect()

    return client
}
