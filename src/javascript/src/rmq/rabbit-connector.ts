import { Connection } from 'amqplib-as-promised';
import { Channel, ConsumeMessage } from "amqplib";
import { RabbitSettingsType } from "../types";

export class RabbitConnector {
    private host: string;
    private port: string | number;
    private username: string;
    private password: string;
    private vhost: string;

    private connection: Connection | null;
    private channel: Channel | null;

    constructor(
        private rabbitSettings: RabbitSettingsType,
        private queueName: string
    ) {
        this.host = rabbitSettings.host;
        this.port = rabbitSettings.port;
        this.username = rabbitSettings.username;
        this.password = rabbitSettings.password;
        this.vhost = rabbitSettings.vhost;
        this.connection = null;
        this.channel = null;
    }

    private async connect(): Promise<[Connection, Channel]> {
        console.log(this.getConnectionURI());
        const connection = new Connection(this.getConnectionURI());
        await connection.init();
        const channel = await connection.createChannel();
        await channel.prefetch(1);
        await channel.assertQueue(this.queueName, { durable: true });
        // @ts-ignore TODO:
        return [connection, channel];
    }

    private getConnectionURI(): string {
        return `amqp://${this.username}:${this.password}@${this.host}:${this.port}${encodeURIComponent(this.vhost)}`
    }

    public async consume(callback: (msg: ConsumeMessage | null) => any): Promise<void> {
        [this.connection, this.channel] = await this.connect();
        await this.channel.consume(this.queueName, callback);
        await this.close();
    }

    public async publish(text: string) {
        if (this.connection !== null && this.channel !== null) {
            [this.connection, this.channel] = await this.connect();
        }

        await this.channel!.sendToQueue(this.queueName, Buffer.from(text));
    }

    private static parseJSON(msg: ConsumeMessage): object {
        const messageString: Buffer = msg.content;
        let messageObject: object;

        if (messageString.length) {
            messageObject = JSON.parse(messageString.toString());
        } else {
            messageObject = {};
        }

        return messageObject;
    }

    public async close() {
        if (this.channel !== null) {
            await this.channel.close();
        }
        if (this.connection !== null) {
            await this.connection.close();
        }

        this.channel = null;
        this.connection = null;
    }
}
