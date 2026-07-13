import { DeploymentAttributes } from "@coordinator/core/domain";
import { OperationQueue } from "@coordinator/core/domain/operation-queue";
import { healthcheckProvider, HealthcheckProvider } from "@coordinator/core/service/healthcheck/healthcheck-provider";
import { DeploymentInfoResponse } from "@coordinator/core/service/info";
import { infoProvider, InfoProvider } from "@coordinator/core/service/info/info-provider";
import {
    deploymentInstanceResolver,
    DeploymentInstanceResolver
} from "@coordinator/core/service/instances/deployment-instance-resolver";
import { lifecycleService, LifecycleService } from "@coordinator/core/service/lifecycle-service";
import { Deployment } from "@core-lib/platform/api/deployment";
import { DeploymentVersion, DeploymentVersionType, OperationResult } from "@core-lib/platform/api/lifecycle";

/**
 * Facade implementation combining and controlling the deployment operations.
 */
export class DeploymentFacade {

    private readonly deploymentInstanceResolver: DeploymentInstanceResolver;
    private readonly lifecycleService: LifecycleService;
    private readonly healthcheckProvider: HealthcheckProvider;
    private readonly infoProvider: InfoProvider;

    constructor(deploymentInstanceResolver: DeploymentInstanceResolver, lifecycleService: LifecycleService,
                healthcheckProvider: HealthcheckProvider, infoProvider: InfoProvider) {
        this.deploymentInstanceResolver = deploymentInstanceResolver;
        this.lifecycleService = lifecycleService;
        this.healthcheckProvider = healthcheckProvider;
        this.infoProvider = infoProvider;
    }

    /**
     * Submits an info request to the given deployment.
     *
     * @param deploymentAttributes DeploymentAttributes object containing the necessary parameters of selecting the relevant deployment
     */
    public async info(deploymentAttributes: DeploymentAttributes): Promise<DeploymentInfoResponse> {

        const deployment = await this.deploymentInstanceResolver.resolveSingleInstance(deploymentAttributes);

        return this.infoProvider.getAppInfo(deployment.id, deployment.info);
    }

    /**
     * Deploys a new version of the given deployment.
     *
     * @param deploymentAttributes DeploymentAttributes object containing the necessary parameters of selecting the relevant deployment
     */
    public async deploy(deploymentAttributes: DeploymentAttributes): Promise<OperationResult> {

        const deployments = await this.deploymentInstanceResolver.resolveInstances(deploymentAttributes);
        const deploymentVersion = this.getDeploymentVersion(deploymentAttributes);

        const queue = OperationQueue.create(deploymentAttributes.deployment);
        deployments.forEach(deployment => {
            queue.enqueue(() => this.lifecycleService.deploy(deployment, deploymentVersion));
            if (deploymentAttributes.roll) {
                queue.enqueue(() => this.lifecycleService.start(deployment));
                queue.enqueue(() => this.mapHealthcheckResponse(deployment));
            }
        })

        return queue.execute();
    }

    /**
     * Starts the deployed version of the given deployment.
     *
     * @param deploymentAttributes DeploymentAttributes object containing the necessary parameters of selecting the relevant deployment
     */
    public async start(deploymentAttributes: DeploymentAttributes): Promise<OperationResult> {
        return this.executeWithHealthcheck(deploymentAttributes, deployment => this.lifecycleService.start(deployment));
    }

    /**
     * Stops the deployed version of the given deployment.
     *
     * @param deploymentAttributes DeploymentAttributes object containing the necessary parameters of selecting the relevant deployment
     */
    public async stop(deploymentAttributes: DeploymentAttributes): Promise<OperationResult> {
        return this.executeWithHealthcheck(deploymentAttributes, deployment => this.lifecycleService.stop(deployment), false);
    }

    /**
     * Restarts the deployed version of the given deployment.
     *
     * @param deploymentAttributes DeploymentAttributes object containing the necessary parameters of selecting the relevant deployment
     */
    public async restart(deploymentAttributes: DeploymentAttributes): Promise<OperationResult> {
        return this.executeWithHealthcheck(deploymentAttributes, deployment => this.lifecycleService.restart(deployment));
    }

    private getDeploymentVersion(deploymentAttributes: DeploymentAttributes): DeploymentVersion {

        return {
            versionType: deploymentAttributes.version
                ? DeploymentVersionType.EXACT
                : DeploymentVersionType.LATEST,
            version: deploymentAttributes.version
        };
    }



    private async executeWithHealthcheck(deploymentAttributes: DeploymentAttributes,
                                         operation: (deployment: Deployment) => Promise<OperationResult>,
                                         runHealthCheck: boolean = true): Promise<OperationResult> {

        const deployments = await this.deploymentInstanceResolver.resolveInstances(deploymentAttributes);
        const queue = OperationQueue.create(deployments[0].id);

        deployments.forEach(deployment => {
            queue.enqueue(() => operation(deployment));
            if (runHealthCheck) {
                queue.enqueue(() => this.mapHealthcheckResponse(deployment));
            }
        })

        return await queue.execute();
    }

    private async mapHealthcheckResponse(deployment: Deployment): Promise<OperationResult> {

        return {
            deployOperation: false,
            deployedVersion: undefined,
            status: await this.healthcheckProvider.executeHealthcheck(deployment.id, deployment.healthcheck)
        };
    }
}

export const deploymentFacade = new DeploymentFacade(deploymentInstanceResolver, lifecycleService, healthcheckProvider, infoProvider);
