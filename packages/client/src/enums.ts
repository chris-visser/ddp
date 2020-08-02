export enum DDPMessage {
    Failed = 'failed',
    Ping = 'ping',
    Pong = 'pong',
    Error = 'error'
}

export enum EventName {
    Negotiation = 'negotiation',
    Connected = 'connected',
    Connecting = 'connecting',
    Refused = 'refused',
    RetryConnect = 'retry',
    Reconnecting = 'reconnecting',
    Disconnected = 'disconnected',
    Error = 'error',
}

export enum ConnectionStatus {
    Connecting = 'connecting',
    Connected = 'connected',
    Disconnecting = 'disconnecting',
    Disconnected = 'disconnected'
}

export enum RequestStatus {
    Success = 'success',
    Error = 'error'
}
