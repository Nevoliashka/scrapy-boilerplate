import vanillaPuppeteer, { Browser, DirectNavigationOptions, Page, Request } from "puppeteer";
import { addExtra } from "puppeteer-extra";
import Apify, { LaunchPuppeteerOptions } from "apify";
//@ts-ignore
import PuppeteerExtraPluginBlockResources from "puppeteer-extra-plugin-block-resources";
//@ts-ignore
import PuppeteerExtraPluginClickAndWait from "puppeteer-extra-plugin-click-and-wait";
import PuppeteerExtraPluginStealth from "puppeteer-extra-plugin-stealth";
import { Settings } from "../settings";

export abstract class BaseSpider {
    public static spiderName: string = 'base';

    protected browser: Browser | null;
    protected page: Page | null;
    protected settings: Settings;
    protected blockedRequestList: Array<(request: Request) => boolean> = [];
    protected allowedRequestList: Array<(request: Request) => boolean> = [];

    protected constructor() {
        this.settings = Settings.getInstance();
    }

    public async run() {
        try {
            await this.launchBrowser();
        } finally {
            await this.closeBrowser();
        }
    };

    protected async addRequestFilter(page: Page) {
        await page.setRequestInterception(true);
        page.on('request', async (request: Request) => {
                if (this.allowedRequestList.some(func => func(request))) {
                    await request.continue();
                    return;
                }

                if (this.blockedRequestList.some(func => func(request))) {
                    await request.abort();
                    return;
                }

                await request.continue();
            }
        );
    }

    protected async closeBrowser() {
        // await this.page.close();
        if (this.browser) {
            await this.browser.close();
        }
    }

    protected async launchBrowser() {
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
            );
        const puppeteerArgs = [];
        let withProxy = this.proxy?.host && this.proxy?.port;
        if (withProxy) {
            puppeteerArgs.push(`--proxy-server=${this.proxy.host}:${this.proxy.port}`);
        }

        const opt: LaunchPuppeteerOptions = {
            puppeteerModule: puppeteerInstance,
            headless: this.settings.puppeteer.headless,
            args: puppeteerArgs
        };
        this.browser = await Apify.launchPuppeteer(opt);
        this.page = await this.browser.newPage();
        await this.addRequestFilter(this.page);
        // TODO: add from settings object
        // await this.page.setViewport(PuppeteerSpider.VIEWPORT_SETTINGS)
        // this.page.setDefaultNavigationTimeout(PuppeteerSpider.default_navigation_timeout)

        if (withProxy && this.proxy?.username && this.proxy?.password) {
            await this.page.authenticate(
                {
                    username: this.proxy.username,
                    password: this.proxy.password,
                },
            );
        }
    };

    protected async loadURL(page: Page, url: string, options: DirectNavigationOptions = {}, maxRetries = 3) {
        let pageLoadTries = 0;
        let lastError: Error | null = null;
        while (pageLoadTries < maxRetries) {
            try {
                return await page.goto(url, options);
            } catch (e) {
                pageLoadTries += 1;
                lastError = e;
            }
        }
        throw lastError;
    }
}

export default BaseSpider;
