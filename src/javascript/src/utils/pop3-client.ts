//@ts-ignore
import { Client } from 'yapople';

import pauseFor from "./pause";
import { logger } from '../logging';

interface Author {
    address: string,
}

interface Message {
    html: string;
    headers: any;
    subject: string;
    references: string[];
    messageId: string;
    inReplyTo: string[];
    priority: string;
    from: Author[];
    replyTo: object[];
    to: object[];
    date: Date;
    receivedDate: Date;
}

export default class POP3Client {
    constructor(
        private email: string,
        private password: string,
        private pop_config: { host: string, port: string }
    ) {
        //
    }

    public async getVerificationCode(startTS: number): Promise<string | null> {
        return new Promise(async (resolve, reject) => {
            const expirationTime = 60 * 1000;
            let currentTS = startTS;

            while (currentTS < (startTS + (2 * expirationTime))) {
                await pauseFor(5000);
                let emailCode: string | null = await this.checkMail(startTS);
                if (emailCode !== null) {
                    return resolve(emailCode);
                }
                currentTS = new Date().getTime();
                logger.info("Tick: %s", currentTS);
            }
            return reject(new Error("Task has been expired"));
        })
    }

    private async checkMail(startTS: number): Promise<string | null> {
        return new Promise((resolve, reject) => {
            const client = new Client({
                hostname: this.pop_config.host,
                port: this.pop_config.port,
                tls: false,
                mailparser: true,
                username: this.email,
                password: this.password
            });

            logger.info('startTS: %s', startTS);
            const threshold = 60 * 1000;
            // const threshold = 2 * 60 * 60 * 1000;

            client.connect(() => {
                client.count((countError: Error, cnt: number) => {
                    const messageNumbers = Array.from(Array(cnt).keys())
                        .map(v => v + 1)
                        .reverse()
                        .slice(0, Math.min(cnt, 10));

                    logger.info("messageNumbers %s", messageNumbers);
                    client.retrieve(messageNumbers, (retrieveError: Error, messages: Array<Message>) => {
                        logger.info("messageNumbers: %s", messages.length);
                        const emailCode = messages.reverse().reduce((code: any, message) => {
                            if (code !== null) {
                                return code;
                            }
                            logger.info("%s %s %s", message.date.getTime(), (startTS - threshold), message.date.getTime() >= (startTS - threshold));
                            if (message.date.getTime() >= (startTS - threshold)) {
                                const emailSenderPattern = 'verify@';
                                const content: Array<Author> = Array.from(message.from);
                                if (content.length && String(content.shift()!.address).includes(emailSenderPattern)) {
                                    logger.info("%s msg to check", emailSenderPattern);
                                    const msgHTML: string = message.html;
                                    const emailCodeRegex = /<strong>([A-Za-z0-9]+)<\/strong><\/td>/gms;
                                    const emailCodeRegexList = [emailCodeRegex];

                                    //@ts-ignore
                                    code = emailCodeRegexList.reduce((a, v) => {
                                        if (a !== null) {
                                            return a;
                                        }
                                        let extractedCode = v.exec(msgHTML);
                                        if (extractedCode !== null && extractedCode.length > 1 && extractedCode[1] !== null) {
                                            return extractedCode[1].trim();
                                        }
                                        return null;
                                    }, null);
                                }
                            }
                            return code;
                        }, null);

                        client.quit();
                        return resolve(emailCode);
                    })
                });
            });
        })
    };
}
