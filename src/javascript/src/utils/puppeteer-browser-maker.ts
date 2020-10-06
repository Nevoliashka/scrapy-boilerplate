import puppeteer, { addExtra, PuppeteerExtra, PuppeteerExtraPlugin } from 'puppeteer-extra';
import vanillaPuppeteer, { Browser, Page } from "puppeteer";
import { Settings } from "../settings";
import { levels, Logger as LoggerMaker } from "./logger";
import { ProxySettings } from "./types";

// TODO: add .d.ts file or ignore this syntax
const ProxyPlugin = require('puppeteer-extra-plugin-proxy');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha');
//@ts-ignore
import PuppeteerExtraPluginBlockResources from "puppeteer-extra-plugin-block-resources";
//@ts-ignore
import PuppeteerExtraPluginClickAndWait from "puppeteer-extra-plugin-click-and-wait";

export default class PuppeteerBrowserMaker {
    private static logger = LoggerMaker.createLogger(PuppeteerBrowserMaker.name, levels.DEBUG);
    private static settings = Settings.getInstance();

    public static async getContext(): Promise<{ browser: Browser, page: Page }> {
        const puppeteerInstance: PuppeteerExtra = addExtra(vanillaPuppeteer);

        const plugins: PuppeteerExtraPlugin[] = [
            this.getProxyPlugin(),
            this.getRecaptchaPlugin(),
            StealthPlugin(),
            PuppeteerExtraPluginClickAndWait(),
            PuppeteerExtraPluginBlockResources({
                blockedTypes: new Set([
                    'eventsource',
                    'fetch',
                    'font',
                    'image',
                    'manifest',
                    'media',
                    'other',
                    'texttrack',
                    'websocket',
                    // 'document',
                    // 'stylesheet',
                    // 'script',
                    // 'xhr',
                ])
            })
        ].filter((plugin): plugin is PuppeteerExtraPlugin => plugin !== null);

        plugins.forEach((plugin: PuppeteerExtraPlugin) => puppeteerInstance.use(plugin));

        const browser = await puppeteer.launch(this.settings.browserOptions);
        const page = await browser.newPage();
        return { browser, page };
    }

    private static getProxyPlugin(): PuppeteerExtraPlugin | null {
        if (this.settings.proxyEnabled) {
            if (this.settings.proxy.host.length && this.settings.proxy.port.length) {
                return ProxyPlugin({
                    address: this.settings.proxy.host,
                    port: Number.parseInt(this.settings.proxy.port),
                    credentials: {
                        username: this.settings.proxy.username,
                        password: this.settings.proxy.password,
                    }
                });
            } else {
                throw new Error('Proxy enabled but not configured');
            }
        } else {
            PuppeteerBrowserMaker.logger.debug('proxy disabled');
        }
        return null;
    }

    private static setStealthPlugin(): void {
        puppeteer.use(StealthPlugin());
    }

    private static getRecaptchaPlugin(): void {
        if (this.settings.captchaSolverEnabled) {
            if (this.settings.captchaSolverApiKey) {
                return RecaptchaPlugin({
                    provider: {
                        id: '2captcha',
                        token: this.settings.captchaSolverApiKey,
                    },
                    visualFeedback: true
                });
            } else {
                throw new Error('Captcha solver by API enabled but not configured');
            }
        }
    }
}
