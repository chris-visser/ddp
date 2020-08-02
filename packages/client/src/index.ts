import WebSocket from 'isomorphic-ws'
import EventEmitter from 'eventemitter3'
import EJSON from 'ejson'

import { DDP_CONNECT_MESSAGE } from './constants';
import { ConnectionStatus, DDPMessage, EventName, RequestStatus } from './enums';

// TODO Add fallback to automatically connect to older versions
export class Client extends EventEmitter {
    url: string
    socketOptions: WebSocket

    // On re-connect
    autoReconnectTimeoutHandle = null
    autoReconnectDelay = 500
    autoReconnectIncrement = 1.6

    // Initial connect
    connectTimeout = 30000
    connectTimeoutHandle = null

    status: ConnectionStatus = ConnectionStatus.Disconnected

    connection: WebSocket = null
    isInitialConnect = true // On first connect we don't autoReconnect
    intendedDisconnect = false // We only autoReconnect if the disconnect was not intended

    messageQueue: Record<string, unknown>[] = [] // Queue up any messages sent before the connection was established

    ddpParams = DDP_CONNECT_MESSAGE

    constructor(url: string, socketOptions?: WebSocket) {
        super()
        this.url = url
        this.socketOptions = socketOptions

        this.connect()
    }

    public connect = (): void => {
        this.intendedDisconnect = false

        this.status = ConnectionStatus.Connecting

        this.connection = new WebSocket(this.url, this.socketOptions)

        this.connection.onopen = this.handleSocketOpen
        this.connection.onerror = (event) => {
            const { type, message, error } = event

            this.emit(EventName.Error, {
                type,
                message,
                error,
            })

        }
        this.connection.onclose = this.handleSocketClosed

        this.listen()
    }

    private handleSocketOpen = () => {
        this.isInitialConnect = false
        this.status = ConnectionStatus.Connected
        this.autoReconnectDelay = 500
        clearTimeout(this.autoReconnectTimeoutHandle)

        // Since the DDP connect must be the first message, lets send it before we emit
        // the 'connected' event. We don't have to wait though
        // (ref: https://github.com/meteor/meteor/blob/devel/packages/ddp/DDP.md#procedure)
        this.send(this.ddpParams)
        // Send all messages that were waiting for the connection to come up
        this.messageQueue.forEach(this.send)
        // Tell the outside world that we're idling
        this.emit(EventName.Connected)
    }

    private handleSocketClosed = (event: CloseEvent) => {
        const { type, wasClean, reason, code } = event

        // When the socket triggers onclose, but as a result of a client that tries to (re)connect,
        // it obviously means that the client is not connected so we should not throw a disconnected event
        if(this.status !== ConnectionStatus.Connecting) {
            this.emit(EventName.Disconnected, { type, wasClean, reason, code, url: this.url })
        }

        // Initial connection attempts have a timeout of n seconds
        if(this.isInitialConnect && !this.connectTimeoutHandle) {
            this.connectTimeoutHandle = setTimeout(() => {
                this.emit(EventName.Error, {
                    type: 'timeout-exceeded',
                    message: `Stopped retrying to connect after ${Math.round(this.connectTimeout / 1000)} seconds`
                })
                this.connectTimeoutHandle = null
                clearTimeout(this.autoReconnectTimeoutHandle)
            }, this.connectTimeout)
        }

        if (!this.intendedDisconnect) {
            this.autoReconnectDelay = this.autoReconnectDelay * this.autoReconnectIncrement
            this.autoReconnectTimeoutHandle = setTimeout(() => {
                this.emit(this.isInitialConnect ? EventName.RetryConnect: EventName.Reconnecting)
                this.connect()
            }, this.autoReconnectDelay)
        }
    }

    /**
     * Resolves when the websocket connection has been established
     * Rejects when the connection was refused on first try
     * Will not attempt to auto reconnect on first try. This is by design,
     * to allow servers to return failure feedback during SSR
     */
    public connected = (): Promise<Client> => {
        if (this.connection.readyState === WebSocket.OPEN) {
            return Promise.resolve(this)
        }
        return new Promise((resolve, reject) => {
            const resolveFunc = () => {
                resolve(this)
                this.removeListener(EventName.Refused, rejectFunc)
            }
            const rejectFunc = (event) => {
                reject(event)
                this.removeListener(EventName.Connected, resolveFunc)
            }

            this.once(EventName.Connected, resolveFunc)
            this.once(EventName.Refused, rejectFunc)
        })
    }

    /**
     * Disconnect if as soon as 'possible'
     */
    public disconnect(): void {
        this.intendedDisconnect = true
        if ([WebSocket.CLOSED, WebSocket.CLOSING].includes(this.connection.readyState)) {
            return
        }
        if (this.connection.readyState === WebSocket.CONNECTING) {
            // Guess we'll have to wait until we are connected and then close asap
            this.once(EventName.Connected, () => this.connection.close(1000, 'intentional'))
            return
        }
        this.connection.close(1000, 'intentional')
    }

    /**
     * A promised based http-like request via the websocket
     * If sending fails, we queue up the messages until the connection has been established
     * then try to send the messages again
     */
    request<Result>(message, namespace: EventName): Promise<Result> {

        return new Promise((resolve, reject) => {
            this.connection.send(EJSON.stringify(message))

            this.once(namespace, (payload: Result, { status }) => {
                if (status === RequestStatus.Success) {
                    resolve(payload)
                } else {
                    reject(payload)
                }
            })
        })
    }

    /**
     * Sends messages to the DDP server if the connection is open
     * If not, it will queue up the messages which will then be sent as
     * soon as the connection is ready
     * @param message
     */
    public send = (message: Record<string, unknown>): void => {
        if (this.connection.readyState !== WebSocket.OPEN) {
            this.messageQueue.push(message)
        } else {
            this.connection.send(EJSON.stringify(message))
        }
    }

    private listen(): void {
        this.connection.onmessage = ({ data }) => {
            const { msg, server_id, ...payload } = EJSON.parse(data)
            if (!msg) {
                return
            }
            if (msg === DDPMessage.Failed) {
                this.emit(EventName.Negotiation, payload, { status: RequestStatus.Error })
            } else if (server_id) {
                this.emit(EventName.Negotiation, payload, { status: RequestStatus.Success })
            }
            if (msg === DDPMessage.Ping) {
                this.send({ msg: DDPMessage.Pong })
            }
            if (msg === DDPMessage.Error) {
                this.emit(EventName.Error, payload)
            }
        }
    }

    // autoReconnect() {
    //     this.autoReconnectTimeout = setTimeout(() => {
    //         console.log('Trying to reconnect')
    //         this.connect()
    //             .catch(() => {
    //                 const timer = this.autoReconnectTimerIncrement *= 2
    //                 console.log(`Failed to auto reconnect. Trying again in ${timer}`)
    //                 this.autoReconnectTimer = timer
    //                 this.autoReconnect()
    //             })
    //             .then(() => {
    //                 console.log('Auto reconnect successful!')
    //                 this.autoReconnectTimer = 0
    //                 this.autoReconnectTimerIncrement = 1000
    //             })
    //     }, this.autoReconnectTimer)
    // }
}
