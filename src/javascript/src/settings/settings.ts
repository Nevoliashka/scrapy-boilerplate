import dotenv from 'dotenv';
import { millisecond, ProxySettings, RabbitSettings } from "../utils/types";
import { LaunchOptions } from "puppeteer";
import strtobool from "../utils/strtobool";
import SettingsProperties from "../utils/interfaces/settings-properties";

export class Settings implements SettingsProperties {
    protected static instance: Settings;

    public readonly proxyEnabled: boolean;
    public readonly proxy: ProxySettings;

    public readonly rabbit: RabbitSettings;

    public readonly browserOptions: LaunchOptions;

    public readonly captchaSolverEnabled: boolean;
    public readonly captchaSolverApiKey?: string;

    public readonly navigationTimeout: millisecond = 30000;

    public readonly pipelines: Array<object> = [];

    public static getInstance(settingsProperties: SettingsProperties = {}): Settings {
        if (!this.instance) {
            this.instance = new this();
        }

        // TODO: it is not check
        Object.assign(this.instance, settingsProperties);
        return this.instance;
    }

    protected constructor() {
        Settings.loadDotEnv();

        this.proxyEnabled = strtobool(process.env.PROXY_ENABLED);

        const [host, port] = process.env.PROXY ? process.env.PROXY.split(':') : ['', ''];
        const [username, password] = process.env.PROXY_AUTH ? process.env.PROXY_AUTH.split(':') : ['', ''];
        this.proxy = { host, port, username, password };

        this.rabbit = {
            host: process.env.RABBITMQ_HOST ? process.env.RABBITMQ_HOST : '',
            port: process.env.RABBITMQ_PORT ? Number.parseInt(process.env.RABBITMQ_PORT) : 5672,
            username: process.env.RABBITMQ_USER ? process.env.RABBITMQ_USER : '',
            password: process.env.RABBITMQ_PASS ? process.env.RABBITMQ_PASS : '',
            vhost: process.env.RABBITMQ_VIRTUAL_HOST ? process.env.RABBITMQ_VIRTUAL_HOST : '/',
        };

        this.browserOptions = {
            headless: !strtobool(process.env.PUPPETEER_DEBUG)
        };

        this.captchaSolverEnabled = strtobool(process.env.CAPTCHA_SOLVER_ENABLED);
        this.captchaSolverApiKey = process.env.CAPTCHA_SOLVER_API_KEY;
    }

    private static loadDotEnv() {
        // This method update process.env properties

        const pathToEnvFile = process.cwd().split('\\').slice(0, -4).join('\\') + '\\.env';
        console.log(pathToEnvFile);
        const result = dotenv.config({ path: pathToEnvFile });

        if (result.error) {
            throw result.error;
        }

        console.log('loadDotEnv');
        // TODO: check 2 time read .env file (overhead)
        //this.loadDotEnv = () => undefined;
    }
}
