import {
    deploymentBinaryInstaller,
    DeploymentBinaryInstaller
} from "@bin-exec-agent/service/execution/handler/deployment-binary-installer";
import {
    deploymentSourceHandler,
    DeploymentSourceHandler
} from "@bin-exec-agent/service/execution/handler/deployment-source-handler";
import { binaryReferenceUtility, BinaryReferenceUtility } from "@bin-exec-agent/utility/binary-reference-utility";
import { storageUtility, StorageUtility } from "@bin-exec-agent/utility/storage-utility";
import { Deployment } from "@core-lib/platform/api/deployment";
import { DeploymentStatus, DeploymentVersion } from "@core-lib/platform/api/lifecycle";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Coordinates the deployment process.
 */
export class DeploymentCoordinator {

    private readonly logger = LoggerFactory.getLogger(DeploymentCoordinator);

    private readonly storageUtility: StorageUtility;
    private readonly binaryReferenceUtility: BinaryReferenceUtility;
    private readonly deploymentSourceHandler: DeploymentSourceHandler;
    private readonly deploymentBinaryInstaller: DeploymentBinaryInstaller;

    constructor(storageUtility: StorageUtility, binaryReferenceUtility: BinaryReferenceUtility,
                deploymentSourceHandler: DeploymentSourceHandler, deploymentBinaryInstaller: DeploymentBinaryInstaller) {

        this.storageUtility = storageUtility;
        this.binaryReferenceUtility = binaryReferenceUtility;
        this.deploymentSourceHandler = deploymentSourceHandler;
        this.deploymentBinaryInstaller = deploymentBinaryInstaller;
    }

    /**
     * Coordinates the deployment process by doing the following steps:
     *  1) Requests creating a DeploymentBinaryReference object.
     *  2) Requests creating the application's work directory.
     *  3) Requests downloading the deployment source binary. Immediately returns with DEPLOY_FAILED_MISSING_VERSION
     *     status, if binary is missing.
     *  4) Requests installing the deployment executable, returns with DEPLOYED status on success.
     *  5) Returns with DEPLOY_FAILED_UNKNOWN in case of any error.
     *
     * @param deployment deployment configuration
     * @param version version to be deployed
     */
    async deploy(deployment: Deployment, version: DeploymentVersion): Promise<DeploymentStatus> {

        try {
            const deploymentBinaryReference = this.binaryReferenceUtility.createDeploymentReference(deployment, version);

            this.storageUtility.createApplicationHomeSubFolder(deploymentBinaryReference);

            if (!await this.deploymentSourceHandler.retrieveBinary(deploymentBinaryReference)) {
                return DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION;
            }

            if (this.deploymentBinaryInstaller.installBinary(deployment, deploymentBinaryReference)) {
                return DeploymentStatus.DEPLOYED;
            }

        } catch (error: any) {
            this.logger.error(`Failed to deploy application, reason: ${error?.message}`);
        }

        return DeploymentStatus.DEPLOY_FAILED_UNKNOWN;
    }
}

export const deploymentCoordinator = new DeploymentCoordinator(
    storageUtility,
    binaryReferenceUtility,
    deploymentSourceHandler,
    deploymentBinaryInstaller);
