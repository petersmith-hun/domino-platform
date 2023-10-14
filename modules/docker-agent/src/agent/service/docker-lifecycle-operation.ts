import { HttpStatus } from "@core-lib/platform/api/common";
import { Deployment } from "@core-lib/platform/api/deployment";
import {
    DeploymentStatus,
    DeploymentVersion,
    DeploymentVersionType,
    OperationResult
} from "@core-lib/platform/api/lifecycle";
import { LifecycleOperation } from "@core-lib/platform/api/lifecycle/lifecycle-operation";
import LoggerFactory from "@core-lib/platform/logging";
import { DockerCommand, ResponseContext } from "@docker-agent/domain";
import {
    dockerEngineApiClient,
    DockerEngineApiClient
} from "@docker-agent/service/docker/client/docker-engine-api-client";
import {
    dockerRequestFactory,
    DockerRequestFactory
} from "@docker-agent/service/docker/factory/docker-request-factory";

/**
 * LifecycleOperation implementation for handling Docker container based deployments.
 */
export class DockerLifecycleOperation implements LifecycleOperation {

    private readonly logger = LoggerFactory.getLogger(DockerLifecycleOperation);
    private readonly dockerRequestFactory: DockerRequestFactory;
    private readonly dockerEngineApiClient: DockerEngineApiClient;


    constructor(dockerRequestFactory: DockerRequestFactory, dockerEngineApiClient: DockerEngineApiClient) {
        this.dockerRequestFactory = dockerRequestFactory;
        this.dockerEngineApiClient = dockerEngineApiClient;
    }

    /**
     * Pulls the defined image and creates a new container. Before creating the container, it also enforces shutting
     * down any running instances of the same deployment, to avoid clashing. On success, resolves with DEPLOYED status,
     * while failure is indicated with DEPLOY_FAILED_UNKNOWN status.
     *
     * @param deployment Deployment descriptor object
     * @param version DeploymentVersion wrapper object containing the version to be deployed
     * @returns OperationResult as described above, wrapped in Promise
     */
    async deploy(deployment: Deployment, version: DeploymentVersion): Promise<OperationResult> {

        const imageName = this.prepareImageName(deployment);
        const tag = version.versionType == DeploymentVersionType.LATEST
            ? "latest"
            : version.version!;
        const dockerPullRequest = this.dockerRequestFactory.createDockerPullRequest(imageName, tag, deployment);

        const pullResult = await this.dockerEngineApiClient.executeDockerCommand(dockerPullRequest);
        const pullSucceeded = this.isCallSuccessful(pullResult);

        let deploymentSuccessful = false;
        if (pullSucceeded) {
            if (!await this.executeLifecycleCommand(deployment, DockerCommand.REMOVE)) {
                this.logger.warn(`Failed to stop running container for app=${deployment.id} - maybe a first time execution?`);
            }
            const dockerCreateRequest = this.dockerRequestFactory.createDockerContainerCreationRequest(imageName, tag, deployment);
            deploymentSuccessful = this.isCallSuccessful(await this.dockerEngineApiClient.executeDockerCommand(dockerCreateRequest));

            if (!deploymentSuccessful) {
                this.logger.error(`Failed to create container for app=${deployment.id} from=${imageName}:${tag}`);
            }
        } else {
            this.logger.error(`Failed to deploy app=${deployment.id} from=${imageName}:${tag}`);
        }

        return this.mapOperationResult(deploymentSuccessful, this.mapDeployOperationStatus(pullResult), tag);
    }

    /**
     * Triggers starting up the already created container instance of the given deployment. Resolves with UNKNOWN_STARTED
     * status on success, START_FAILURE otherwise.
     *
     * @param deployment Deployment descriptor object
     * @returns OperationResult as described above, wrapped in Promise
     */
    async start(deployment: Deployment): Promise<OperationResult> {

        return this.mapOperationResult(await this.executeLifecycleCommand(deployment, DockerCommand.START), success => success
            ? DeploymentStatus.UNKNOWN_STARTED
            : DeploymentStatus.START_FAILURE);
    }

    /**
     * Triggers stopping the running container instance of the given deployment. Resolves with UNKNOWN_STOPPED status on
     * success, STOP_FAILURE otherwise.
     *
     * @param deployment Deployment descriptor object
     * @returns OperationResult as described above, wrapped in Promise
     */
    async stop(deployment: Deployment): Promise<OperationResult> {

        return this.mapOperationResult(await this.executeLifecycleCommand(deployment, DockerCommand.STOP), success => success
            ? DeploymentStatus.UNKNOWN_STOPPED
            : DeploymentStatus.STOP_FAILURE);
    }

    /**
     * Triggers restarting the running container instance of the given deployment. Resolves with UNKNOWN_STARTED status
     * on success, START_FAILURE otherwise.
     *
     * @param deployment Deployment descriptor object
     * @returns OperationResult as described above, wrapped in Promise
     */
    async restart(deployment: Deployment): Promise<OperationResult> {

        return this.mapOperationResult(await this.executeLifecycleCommand(deployment, DockerCommand.RESTART), success => success
            ? DeploymentStatus.UNKNOWN_STARTED
            : DeploymentStatus.START_FAILURE);
    }

    private prepareImageName(deployment: Deployment): string {

        return deployment.source.home && deployment.source.home.length > 0
            ? `${deployment.source.home}/${deployment.source.resource}`
            : `${deployment.source.resource}`;
    }

    private async executeLifecycleCommand(deployment: Deployment, dockerCommand: DockerCommand): Promise<boolean> {

        const dockerRequest = this.dockerRequestFactory.createDockerLifecycleCommand(deployment, dockerCommand);
        const responseContext = await this.dockerEngineApiClient.executeDockerCommand(dockerRequest);

        return this.isCallSuccessful(responseContext);
    }

    private mapOperationResult(success: boolean, statusMapping: (success: boolean) => DeploymentStatus, version?: string): OperationResult {

        return {
            status: statusMapping(success),
            deployOperation: false,
            deployedVersion: version
        };
    }

    private isCallSuccessful(responseContext: ResponseContext<any>): boolean {

        return responseContext.statusCode !== undefined
            && responseContext.statusCode >= 200
            && responseContext.statusCode < 300;
    }

    private mapDeployOperationStatus(pullResult: ResponseContext<unknown>): (success: boolean) => DeploymentStatus {

        return success => {

            let status = DeploymentStatus.DEPLOYED;
            if (!success) {
                status = pullResult.statusCode === HttpStatus.NOT_FOUND
                    ? DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION
                    : DeploymentStatus.DEPLOY_FAILED_UNKNOWN;
            }

            return status;
        };
    }
}

export const dockerLifecycleOperation = new DockerLifecycleOperation(dockerRequestFactory, dockerEngineApiClient);
