import { millisecond, ProxySettings, RabbitSettings } from "../types";
import { LaunchOptions } from "puppeteer";

export default interface SettingsProperties {
    proxyEnabled?: boolean;
    proxy?: ProxySettings;

    rabbit?: RabbitSettings;

    browserOptions?: LaunchOptions;

    captchaSolverEnabled?: boolean;
    captchaSolverApiKey?: string;

    navigationTimeout?: millisecond,

    pipelines?: Array<object>
}
