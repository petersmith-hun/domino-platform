import { SpawnControlConfig, spawnControlConfigModule } from "@bin-exec-agent/config/spawn-control-config-module";
import { DeploymentBinaryReference } from "@bin-exec-agent/domain/common";
import { executorUserRegistry, ExecutorUserRegistry } from "@bin-exec-agent/registry/executor-user-registry";
import { Deployment } from "@core-lib/platform/api/deployment";
import LoggerFactory from "@core-lib/platform/logging";
import AdmZip from "adm-zip";
import fs from "fs";

const defaultExecutionPermission = 0o774;

/**
 * Handles copying a binary executable into the application home and preparing it for execution.
 */
export class DeploymentBinaryInstaller {

    private readonly logger = LoggerFactory.getLogger(DeploymentBinaryInstaller);
    private readonly spawnControlConfig: SpawnControlConfig;
    private readonly executorUserRegistry: ExecutorUserRegistry;

    constructor(spawnControlConfig: SpawnControlConfig, executorUserRegistry: ExecutorUserRegistry) {
        this.spawnControlConfig = spawnControlConfig;
        this.executorUserRegistry = executorUserRegistry;
    }

    /**
     * Prepares the binary executable of a deployment for execution by doing the following steps:
     *  1) If the source files is a .zip archive (and auto-unpack is enabled), unpacks it into the application work
     *     directory, otherwise it copies the file over there.
     *  2) Updates the permissions of the entry point of the application.
     *
     * @param deployment deployment configuration
     * @param deploymentBinaryReference application related references used in the installation process
     */
    public installBinary(deployment: Deployment, deploymentBinaryReference: DeploymentBinaryReference): boolean {

        try {
            if (this.shouldUnpack(deploymentBinaryReference)) {
                this.unpackToHome(deploymentBinaryReference);
            } else {
                this.copyBinaryToHome(deploymentBinaryReference);
            }
            this.updatePermissions(deployment, deploymentBinaryReference);
            this.logger.info(`Installation of deployment ${deployment.id} completed`);

        } catch (error: any) {
            this.logger.error(`Installation of deployment ${deployment.id} failed, reason: ${error?.message}`);
            return false;
        }

        return true;
    }

    private shouldUnpack(deploymentBinaryReference: DeploymentBinaryReference): boolean {

        return this.spawnControlConfig.autoUnpack
            && deploymentBinaryReference.storePath.endsWith(".zip");
    }

    private unpackToHome(deploymentBinaryReference: DeploymentBinaryReference): void {

        this.logger.info(`Unpacking archive to ${deploymentBinaryReference.applicationPath} ...`);

        const zip = new AdmZip(deploymentBinaryReference.storePath);
        zip.extractAllTo(deploymentBinaryReference.workDirectory);
    }

    private copyBinaryToHome(deploymentBinaryReference: DeploymentBinaryReference): void {

        this.logger.info(`Copying binary from ${deploymentBinaryReference.storePath} to ${deploymentBinaryReference.applicationPath} ...`);
        fs.copyFileSync(deploymentBinaryReference.storePath, deploymentBinaryReference.applicationPath);
    }

    private updatePermissions(deployment: Deployment, deploymentBinaryReference: DeploymentBinaryReference) {

        this.logger.info(`Updating permissions of binary ${deploymentBinaryReference.applicationPath} ...`);
        const user = this.executorUserRegistry.getUser(deployment.execution.asUser!);
        fs.chmodSync(deploymentBinaryReference.applicationPath, defaultExecutionPermission);
        fs.chownSync(deploymentBinaryReference.applicationPath, user.userID, user.groupID);
    }
}

export const deploymentBinaryInstaller = new DeploymentBinaryInstaller(spawnControlConfigModule.getConfiguration(), executorUserRegistry);
