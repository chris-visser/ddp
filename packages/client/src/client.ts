import WebSocket from 'isomorphic-ws'
import EventEmitter from 'eventemitter3'
import EJSON from 'ejson'
import { unique } from 'shorthash'

import { defaultLogger, Logger } from './logger';
import { ConnectionState } from './enums';
import { DDP_CONNECT_MESSAGE } from './constants';

// TODO Add fallback to automatically connect to older versions
export class Client extends EventEmitter {
    logger: Logger
    url: string
    socketOptions: WebSocket

    connection = null
    subscriptions = {}
    messageQueue = []
    intendedDisconnect = false

    ddpParams = DDP_CONNECT_MESSAGE

    constructor(url: string, socketOptions?: WebSocket, logger?: Logger) {
        super()
        this.logger = logger || defaultLogger
        this.url = url
        this.socketOptions = socketOptions
    }

    async connect(): Promise<string> {
        // Whenever intendedDisconnect is set to false, we need to assume that the client did not want to
        // break the connection and therefore we should try to reconnect
        this.intendedDisconnect = false
        await this.connectSocket()

        this.send(this.ddpParams)

        this.listen()

        return new Promise((resolve, reject) => {
            this.once('connected', ({ serverId }) => {
                this.logger.info('[DDP] connected')
                this.messageQueue.forEach(this.send)
                resolve(serverId)
            })
            this.once('invalid-ddp-negotiation', (payload) => {
                const feedback = {
                    given: this.ddpParams,
                    expected: payload,
                }
                this.logger.error(`[DDP] Error: invalid version negotiation. Expected version ${payload.version}, but version ${this.ddpParams.version} was given.`)
                reject({
                    reason: 'Invalid version negotiation',
                    feedback,
                })
            })
        })
    }

    disconnect(): void {
        this.intendedDisconnect = true
        this.logger.info('[DDP] closing websocket connection')

        // TODO listen for close event and resolve the disconnect method as a Promise
        // Because connection.close can fail
        this.connection.close(1000, 'intentional')
    }

    listen(): void {
        this.connection.onmessage = ({ data }) => {
            const { msg, server_id, ...payload } = EJSON.parse(data)
            if (server_id) {
                this.emit('connected', { serverId: server_id })
            }
            if (msg === 'failed') {
                return this.emit('invalid-ddp-negotiation', payload)
            }
            if (msg === 'ping') {
                return this.send({ msg: 'pong' })
            }
            if (msg === 'ready') {
                const { subs } = payload
                subs.forEach(id => this.emit(`ready.${id}`, payload))
            }
            if (msg === 'nosub') {
                const { id } = payload
                this.emit(`nosub.${id}`, payload.error)
            }
            if (msg === 'close') {
                this.logger.info('CLOSE')
            }
            if (['added', 'removed', 'updated'].includes(msg)) {
                this.emit(`${payload.collection}.${msg}`, {
                    id: payload.id,
                    ...payload.fields,
                })
            }
        }
    }

    connectSocket(): Promise<void> {
        return new Promise((resolve) => {

            this.connection = new WebSocket(this.url, this.socketOptions)

            this.connection.onopen = () => resolve()
            this.connection.onerror = this.logger.error
            this.connection.onclose = () => {
                if (!this.intendedDisconnect) {
                    this.logger.warning('[DDP] websocket connection closed unexpectedly')
                } else {
                    this.logger.info('[DDP] websocket connection closed')
                }

                this.emit('disconnected', { intended: this.intendedDisconnect })
            }
        })
    }

    /**
     * If sending fails, we queue up the messages until the connection has been established
     * then try to send the messages again
     */
    send(message): void {
        if (this.connection.readyState === ConnectionState.Connecting) {
            this.messageQueue.push(message)
        }
        if (this.connection.readyState === ConnectionState.Open) {
            this.connection.send(EJSON.stringify(message))
        }
    }

    /**
     * Subscribes to a publication
     * @param name - Name of the publication
     * @param params - Either an array or an object with parameters to send to the publication endpoint
     * @returns a publication id that allows unsubscribe(id)
     */
    subscribe(name, params = []): Promise<string> {
        return new Promise((resolve, reject) => {
            const sanitizedParams = Array.isArray(params) ? params : [params]
            const hash = EJSON.stringify({
                name,
                params,
            })
            const id = unique(hash)

            const sub = this.subscriptions[id]

            if (sub) {
                this.subscriptions[id] = {
                    ...sub,
                    count: sub.count + 1,
                }
            } else {
                this.subscriptions[id] = {
                    count: 1,
                    status: 'pending',
                }
            }

            // Immediately resolve, because other subscription with same params was already ready.
            if (this.subscriptions[id].count > 1 && this.subscriptions[id].status === 'ready') {
                return resolve(id)
            }

            this.once(`ready.${id}`, () => resolve(id))
            this.once(`nosub.${id}`, reject)

            if (!sub) { // actual subscription if first sub
                this.send({
                    msg: 'sub',
                    id,
                    name,
                    params: sanitizedParams,
                })
            }
        })
    }

    // TODO return a promise that waits until the unsubscription has finished
    unsubscribe(id): void {

        // Retrieve the subscription info
        const sub = this.subscriptions[id]

        if (!sub) {
            return
        }

        // If more of the same subscriptions are active, we don't want to unsubscribe from the server
        // just decrement
        if (sub.count > 1) {
            return this.subscriptions[id] = {
                ...sub,
                count: sub.count - 1,
            }
        }

        // In case there was just one subscription, remove the ref and send the unsub to the server
        delete this.subscriptions[id]

        this.send({
            msg: 'unsub',
            id,
        })
    }
}
