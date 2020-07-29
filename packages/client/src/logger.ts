export type Logger = {
    info: (message: unknown) => void,
    warning: (message: unknown) => void,
    error: (message: unknown) => void,
}

export const defaultLogger: Logger = {
    info: console.log,
    warning: console.warn,
    error: console.error,
}
