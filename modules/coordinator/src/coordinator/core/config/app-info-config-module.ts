import { buildTime } from "@coordinator-build-time";
import { version } from "@coordinator-package";
import { ConfigurationModule } from "@core-lib/platform/config";
import LoggerFactory from "@core-lib/platform/logging";

type ActuatorConfigKey = "app-name" | "abbreviation";

/**
 * Application info config parameters.
 */
export interface AppInfoConfig {

    applicationName: string;
    abbreviation: string;
    version: string;
    buildTime: string;
}

/**
 * ConfigurationModule implementation for initializing the application info configuration.
 */
export class AppInfoConfigModule extends ConfigurationModule<AppInfoConfig, ActuatorConfigKey> {

    constructor() {
        super("info", mapNode => {
            return {
                applicationName: super.getValue(mapNode, "app-name"),
                abbreviation: super.getValue(mapNode, "abbreviation"),
                version: version,
                buildTime: buildTime ?? new Date().toISOString()
            }
        }, LoggerFactory.getLogger(AppInfoConfigModule));

        super.init();
        this.logger?.info(`Initializing ${this.getConfiguration().abbreviation} v${this.getConfiguration().version}...`);
    }
}

export const appInfoConfigModule = new AppInfoConfigModule();
