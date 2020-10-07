import { Settings } from "./settings";
import strtobool from "../utils/strtobool";


export class GoogleMapsSettings extends Settings {
    protected static instance: GoogleMapsSettings;
    public isPaginationWalkEnabled: boolean = false;

    constructor() {
        super();
        this.isPaginationWalkEnabled = strtobool(process.env.GOOGLE_MAPS_PAGINATION_WALK_ENABLED);
    }

    public static getInstance(): GoogleMapsSettings {
        if (!this.instance) {
            this.instance = new this();
        }

        return Object.freeze(this.instance);
    }
}
