export type millisecond = number;

export interface ProxySettings {
    host: string,
    port: string,
    username?: string,
    password?: string,
}

export interface RabbitSettings {
    host: string,
    port: string | number,
    username: string,
    password: string,
    vhost: string,
    // TODO: add to rabbit-connector
    retryTimes?: number,
    errorQueue?: string,
    resultQueue?: number,
}
