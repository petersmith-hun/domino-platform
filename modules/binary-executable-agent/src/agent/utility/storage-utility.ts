import { StorageConfig, storageConfigModule } from "@bin-exec-agent/config/storage-config-module";
import { DeploymentBinaryReference } from "@bin-exec-agent/domain/common";
import LoggerFactory from "@core-lib/platform/logging";
import fs from "node:fs";

const defaultDirectoryPermission = 0o644;

/**
 * Utility implementation handling storage related operations.
 */
export class StorageUtility {

    private readonly logger = LoggerFactory.getLogger(StorageUtility);

    private storageConfig: StorageConfig;

    constructor(storageConfig: StorageConfig) {
        this.storageConfig = storageConfig;
    }

    /**
     * Creates the deployment store and application home root storage paths (if they don't exist yet). Also configures
     * the necessary permissions on both paths.
     */
    public createStorage(): void {

        this.doCreateStorage("Deployment store", this.storageConfig.deploymentStorePath);
        this.doCreateStorage("Application home", this.storageConfig.applicationHomePath);
    }

    /**
     * Ensures the created storage paths to have the right permissions.
     */
    public ensureStorageAccess(): void {

        this.doEnsureStorageAccess(this.storageConfig.deploymentStorePath);
        this.doEnsureStorageAccess(this.storageConfig.applicationHomePath);
    }

    /**
     * Creates an application home folder under the application home root path.
     *
     * @param deploymentBinaryReference DeploymentBinaryReference object containing the application work directory path to be created
     */
    public createApplicationHomeSubFolder(deploymentBinaryReference: DeploymentBinaryReference): void {

        this.doCreateStorage(`Home sub-directory for deployment ${deploymentBinaryReference.deploymentID}`, deploymentBinaryReference.workDirectory);
        this.doEnsureStorageAccess(deploymentBinaryReference.workDirectory);
    }

    private doCreateStorage(storageType: string, storagePath: string): void {

        if (!fs.existsSync(storagePath)) {
            this.logger.warn(`${storageType} storage on path ${storagePath} does not exist, trying to create`);
            fs.mkdirSync(storagePath, {
                recursive: true,
                mode: defaultDirectoryPermission
            });
        } else {
            this.logger.info(`${storageType} storage on path ${storagePath} already exists`);
        }
    }

    private doEnsureStorageAccess(storagePath: string): void {
        fs.accessSync(storagePath, fs.constants.R_OK | fs.constants.W_OK);
    }
}

export const storageUtility = new StorageUtility(storageConfigModule.getConfiguration());
