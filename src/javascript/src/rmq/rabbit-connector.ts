import { Connection, Channel } from 'amqplib-as-promised';
import { MessageHandler } from "amqplib-as-promised/lib/channel";
import { RabbitSettings } from "../utils/types";

export class RabbitConnector {
    private readonly host: string;
    private readonly port: string | number;
    private readonly username: string;
    private readonly password: string;
    private readonly vhost: string;
    private connection: Connection | null;
    private channel: Channel | null;

    public constructor(
        private rabbitSettings: RabbitSettings,
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

    public async publish(text: string) {
        const channel = await this.getChannel();
        await channel.sendToQueue(this.queueName, Buffer.from(text));
    }

    public async consume(callback: (msg: MessageHandler | null) => any): Promise<void> {
        const channel = await this.getChannel();
        await channel.consume(this.queueName, callback);
        await this.close();
    }

    public async close() {
        if (this.channel !== null) {
            await this.channel.close();
            this.channel = null;
        }
        if (this.connection !== null) {
            await this.connection.close();
            this.connection = null;
        }
    }

    private async connect(): Promise<void> {
        console.log(this.getConnectionURI());
        this.connection = new Connection(this.getConnectionURI());
        await this.connection.init();
        this.channel = await this.connection.createChannel();
        await this.channel.prefetch(1);
        await this.channel.assertQueue(this.queueName, { durable: true });
    }

    private async getChannel(): Promise<Channel> {
        if (!this.channel) {
            await this.connect();
        }
        return this.channel!;
    }

    private getConnectionURI(): string {
        return `amqp://${this.username}:${this.password}@${this.host}:${this.port}${encodeURIComponent(this.vhost)}`;
    }
}
