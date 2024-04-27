import { ConfigurationModule } from "@core-lib/platform/config";

type StorageConfigKey = "deployment-store-path" | "application-home-path";

/**
 * Executable binary storage settings.
 */
export interface StorageConfig {

    /**
     * Storage path for downloaded deployment executables.
     */
    deploymentStorePath: string;

    /**
     * Application work directory root path.
     */
    applicationHomePath: string;
}

/**
 * ConfigurationModule implementation for initializing the storage configuration.
 */
export class StorageConfigModule extends ConfigurationModule<StorageConfig, StorageConfigKey> {

    constructor() {
        super("storage", storageNode => {
            return {
                deploymentStorePath: super.getValue(storageNode, "deployment-store-path"),
                applicationHomePath: super.getValue(storageNode, "application-home-path")
            }
        });

        super.init();
    }
}

export const storageConfigModule = new StorageConfigModule();
