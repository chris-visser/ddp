import { Client } from './client';

export const createClient = (URL: string): Client => {
    return new Client(URL)
}

export default {
    createClient
}

