import { Browser, Page, Request } from "puppeteer";
import { Settings } from "../settings";
import PuppeteerBrowserMaker from "../utils/puppeteer-browser-maker";
import SettingsProperties from "../utils/interfaces/settings-properties";
import { levels, Logger } from "../utils/logger";
import { Logger as LoggerInterface } from "winston";

export abstract class Spider {
    public static spiderName: string = 'base';

    public settings: Settings;
    public logger: LoggerInterface;
    protected browser: Browser | null = null;
    protected page: Page | null = null;
    protected blockedRequestList: Array<(request: Request) => boolean> = [];
    protected allowedRequestList: Array<(request: Request) => boolean> = [];

    customSettings: SettingsProperties = {
        navigationTimeout: 30000,
    };

    protected constructor() {
        this.settings = Settings.getInstance();
        this.logger = Logger.createLogger(this.constructor.name, levels.DEBUG);
    }

    abstract convertArgsToInputMessage(args: unknown): object;

    //@ts-ignore
    abstract async* process(inputMessage: object): AsyncGenerator<number, never, void>;

    public async run(args: unknown) {
        try {
            await this.launchBrowser();
            for await (const item of this.process(this.convertArgsToInputMessage(args))) {

            }
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
