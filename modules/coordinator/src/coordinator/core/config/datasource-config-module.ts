import { ConfigurationModule } from "@core-lib/platform/config";
import LoggerFactory from "@core-lib/platform/logging";

type DatasourceConfigKey = "sqlite-datafile-path" | "enable-auto-import";

/**
 * SQLite datasource config parameters.
 */
export interface DatasourceConfig {
    sqliteDatafilePath: string;
    enableAutoImport: boolean;
}

/**
 * ConfigurationModule implementation for initializing the datasource configuration.
 */
export class DatasourceConfigModule extends ConfigurationModule<DatasourceConfig, DatasourceConfigKey> {

    constructor() {
        super("datasource", mapNode => {
            return {
                sqliteDatafilePath: super.getValue(mapNode, "sqlite-datafile-path"),
                enableAutoImport: super.getValue(mapNode, "enable-auto-import")
            }
        }, LoggerFactory.getLogger(DatasourceConfigModule));

        this.init();
    }
}

export const datasourceConfigModule = new DatasourceConfigModule();
