import { StorageConfig, storageConfigModule } from "@bin-exec-agent/config/storage-config-module";
import { DeploymentBinaryReference, LifecycleBinaryReference } from "@bin-exec-agent/domain/common";
import { Deployment } from "@core-lib/platform/api/deployment";
import { DeploymentVersion } from "@core-lib/platform/api/lifecycle";
import path from "node:path";

/**
 * Utility implementation for creating reference objects for deployment and lifecycle operations.
 */
export class BinaryReferenceUtility {

    private readonly storageConfig: StorageConfig;

    constructor(storageConfig: StorageConfig) {
        this.storageConfig = storageConfig;
    }

    /**
     * Creates a binary reference for deployment operations by including the following information:
     *  - Deployment ID (for tracking purposes);
     *  - Resolved source deployment executable path: substitutes the {version} parameter in the source path, defined by
     *    the source.home deployment configuration parameter;
     *  - Resolved deployment storage path: deployment store path appended with the resolved source filename;
     *  - Resolved work directory: application home path appended with the application's own home directory (same as the deployment ID);
     *  - Resolved application path: work directory appended with the application's executable filename.
     *
     * @param deployment deployment configuration
     * @param version version descriptor
     */
    public createDeploymentReference(deployment: Deployment, version: DeploymentVersion): DeploymentBinaryReference {

        const resolvedVersion = version.version ?? "latest";
        const storeFilename = this.createDeploymentStoreFilename(deployment, resolvedVersion);

        return {
            sourcePath: deployment.source.home.replace("{version}", resolvedVersion),
            storePath: path.posix.join(this.storageConfig.deploymentStorePath, storeFilename),
            ... this.createLifecycleReference(deployment)
        }
    }

    /**
     * Creates a binary reference for lifecycle operations by including the following information:
     *  - Deployment ID (for tracking purposes);
     *  - Resolved work directory: application home path appended with the application's own home directory (same as the deployment ID);
     *  - Resolved application path: work directory appended with the application's executable filename (defined by the
     *    source.resource deployment configuration parameter).
     *
     * @param deployment deployment configuration
     */
    public createLifecycleReference(deployment: Deployment): LifecycleBinaryReference {

        const workDirectory = path.posix.join(this.storageConfig.applicationHomePath, deployment.id);

        return {
            deploymentID: deployment.id,
            workDirectory: workDirectory,
            applicationPath: path.posix.join(workDirectory, deployment.source.resource)
        }
    }

    private createDeploymentStoreFilename(deployment: Deployment, resolvedVersion: string): string {

        const extension = deployment.source.home.split("\.").pop() ?? "";

        return `executable-${deployment.id}-v${resolvedVersion}.${extension}`;
    }
}

export const binaryReferenceUtility = new BinaryReferenceUtility(storageConfigModule.getConfiguration());
