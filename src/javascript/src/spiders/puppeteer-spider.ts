import Apify from "apify";
import { LaunchPuppeteerOptions } from "apify";
import vanillaPuppeteer, { Browser, DirectNavigationOptions, NavigationOptions, Page, Response } from "puppeteer";
import { addExtra } from "puppeteer-extra";
//@ts-ignore
import PuppeteerExtraPluginBlockResources from "puppeteer-extra-plugin-block-resources";
//@ts-ignore
import PuppeteerExtraPluginClickAndWait from "puppeteer-extra-plugin-click-and-wait";
import PuppeteerExtraPluginStealth from "puppeteer-extra-plugin-stealth";
import { logger } from '../logging';
import minToMsec from '../utils/time';
import RuCaptchaClient from "../utils/ru-captcha-client";

export default class PuppeteerSpider {
    /**
     * Returns spiger name.
     */
    public static get spiderName(): string {
        return 'puppeteer_spider'
    }

    /**
     * Returns viewport settings for page. Use `settings` param to override the defaults.
     *
     * @param {object} settings
     * @returns {object}
     */
    viewport_settings(settings) {
        return Object.assign({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            isLandscape: false
        }, settings)
    }

    /**
     * Returns default navigation timeout in milliseconds.
     *
     * @returns {number}
     */
    static get default_navigation_timeout() {
        return minToMsec(5)
    }

    private browser: Browser | null = null;
    private page: Page | null = null;

    constructor(
        settings: Settings,
        //ruCaptchaKey = null,
        //proxySettings = null
    ) {
        this.settings = settings;
        //this.start_url = 'https://example.org';
        //this._ruCaptchaClient = new RuCaptchaClient(ruCaptchaKey);
        //this.proxy = proxySettings;
    }

    protected async launchBrowser() {
        /**
         * configure Puppeteer Extra browser and plugins
         */
        const puppeteerInstance = addExtra(vanillaPuppeteer);
        puppeteerInstance
            .use(
                PuppeteerExtraPluginStealth()
            )
            .use(
                PuppeteerExtraPluginClickAndWait()
            )
            .use(
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
            )
        ;
        const puppeteerArgs = [];
        let withProxy = this.proxy?.host && this.proxy?.port;
        if (withProxy) {
            puppeteerArgs.push(`--proxy-server=${this.proxy.host}:${this.proxy.port}`);
        }
        /**
         * @type {LaunchPuppeteerOptions}
         */
        const opt = {
            puppeteerModule: puppeteerInstance,
            headless: this.settings.puppeteer.headless,
            args: puppeteerArgs
        };
        this.browser = await Apify.launchPuppeteer(opt);
        this.page = await this.browser.newPage();

        await this.page.setViewport(PuppeteerSpider.VIEWPORT_SETTINGS)
        this.page.setDefaultNavigationTimeout(PuppeteerSpider.default_navigation_timeout)

        if (withProxy && this.proxy?.username && this.proxy?.password) {
            await this.page.authenticate(
                {
                    username: this.proxy.username,
                    password: this.proxy.password,
                },
            );
        }
    };

    public async run() {
        try {
            await this.launchBrowser();
        } finally {
            await this.closeBrowser();
        }
    };

    protected async goWithRetries(url: string, options?: DirectNavigationOptions, maxRetries: number = 3): Promise<Response> {
        let pageLoadTries = 0;
        let lastError = null;
        while (pageLoadTries < maxRetries) {
            try {
                const response: Response | null = await this.page.goto(url, options);
                return response!;
            } catch (e) {
                pageLoadTries += 1;
                lastError = e;
            }
        }
        throw lastError;
    }

    protected async closeBrowser() {
        // await this.page.close();
        if (this.browser) {
            await this.browser.close();
        }
    }
}

