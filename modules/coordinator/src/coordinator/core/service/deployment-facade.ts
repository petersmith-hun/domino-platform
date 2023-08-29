import { deploymentConfigModule, DeploymentRegistry } from "@coordinator/core/config/deployment-config-module";
import { DeploymentAttributes } from "@coordinator/core/domain";
import { healthcheckProvider, HealthcheckProvider } from "@coordinator/core/service/healthcheck/healthcheck-provider";
import { DeploymentInfoResponse } from "@coordinator/core/service/info";
import { infoProvider, InfoProvider } from "@coordinator/core/service/info/info-provider";
import { lifecycleService, LifecycleService } from "@coordinator/core/service/lifecycle-service";
import { Deployment } from "@core-lib/platform/api/deployment";
import {
    DeploymentStatus,
    DeploymentVersion,
    DeploymentVersionType,
    OperationResult
} from "@core-lib/platform/api/lifecycle";

/**
 * Facade implementation combining and controlling the deployment operations.
 */
export class DeploymentFacade {

    private readonly deploymentRegistry: DeploymentRegistry;
    private readonly lifecycleService: LifecycleService;
    private readonly healthcheckProvider: HealthcheckProvider;
    private readonly infoProvider: InfoProvider;

    constructor(deploymentRegistry: DeploymentRegistry, lifecycleService: LifecycleService,
                healthcheckProvider: HealthcheckProvider, infoProvider: InfoProvider) {
        this.deploymentRegistry = deploymentRegistry;
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

        const deployment = this.getDeployment(deploymentAttributes);

        return this.infoProvider.getAppInfo(deployment.id, deployment.info);
    }

    /**
     * Deploys a new version of the given deployment.
     *
     * @param deploymentAttributes DeploymentAttributes object containing the necessary parameters of selecting the relevant deployment
     */
    public async deploy(deploymentAttributes: DeploymentAttributes): Promise<OperationResult> {

        const deployment = this.getDeployment(deploymentAttributes);
        const deploymentVersion = this.getDeploymentVersion(deploymentAttributes);

        return this.lifecycleService.deploy(deployment, deploymentVersion);
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

        const deployment = this.getDeployment(deploymentAttributes);

        return this.lifecycleService.stop(deployment);
    }

    /**
     * Restarts the deployed version of the given deployment.
     *
     * @param deploymentAttributes DeploymentAttributes object containing the necessary parameters of selecting the relevant deployment
     */
    public async restart(deploymentAttributes: DeploymentAttributes): Promise<OperationResult> {
        return this.executeWithHealthcheck(deploymentAttributes, deployment => this.lifecycleService.restart(deployment));
    }

    private getDeployment(deploymentAttributes: DeploymentAttributes): Deployment {
        return this.deploymentRegistry.getDeployment(deploymentAttributes.deployment);
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
                                         operation: (deployment: Deployment) => Promise<OperationResult>): Promise<OperationResult> {

        const deployment = this.getDeployment(deploymentAttributes);
        const operationResult = await operation(deployment);

        return operationResult.status === DeploymentStatus.UNKNOWN_STARTED
            ? { deployOperation: false, status: await this.healthcheckProvider.executeHealthcheck(deployment.id, deployment.healthcheck) }
            : operationResult;
    }
}

export const deploymentFacade = new DeploymentFacade(deploymentConfigModule.getConfiguration(), lifecycleService, healthcheckProvider, infoProvider);
