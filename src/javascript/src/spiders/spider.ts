import { Browser, Page, Request } from "puppeteer";
import { Settings } from "../settings";
import PuppeteerBrowserMaker from "../utils/puppeteer-browser-maker";
import SettingsProperties from "../utils/interfaces/settings-properties";

export abstract class Spider {
    public static spiderName: string = 'base';

    protected browser: Browser | null = null;
    protected page: Page | null = null;
    protected settings: Settings;
    protected blockedRequestList: Array<(request: Request) => boolean> = [];
    protected allowedRequestList: Array<(request: Request) => boolean> = [];

    customSettings: SettingsProperties = {};

    protected constructor() {
        this.settings = Settings.getInstance();
    }

    abstract convertArgsToInputMessage(args: unknown): object;

    public async run(args: unknown) {
        try {
            await this.launchBrowser();
            await this.process(this.convertArgsToInputMessage(args));
        } finally {
            await this.closeBrowser();
        }
    };

    protected async process(inputMessage: object): Promise<object> {
        // TODO: yield item, process item in pipeline
        return {};
    }

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

    protected async launchBrowser(): Promise<void> {
        const { browser, page } = await PuppeteerBrowserMaker.getContext();
        await this.addRequestFilter(page);
        this.browser = browser;
        this.page = page;
    };

    protected async closeBrowser() {
        // await this.page.close();
        if (this.browser) {
            await this.browser.close();
        }
    }
}

export default Spider;
