import { DeploymentAttributes } from "@coordinator/core/domain";
import { UnknownDeploymentError } from "@coordinator/core/error/error-types";
import {
    deploymentDefinitionService,
    DeploymentDefinitionService
} from "@coordinator/core/service/deployment-definition-service";
import { healthcheckProvider, HealthcheckProvider } from "@coordinator/core/service/healthcheck/healthcheck-provider";
import { DeploymentInfoResponse } from "@coordinator/core/service/info";
import { infoProvider, InfoProvider } from "@coordinator/core/service/info/info-provider";
import { lifecycleService, LifecycleService } from "@coordinator/core/service/lifecycle-service";
import { ExtendedDeployment } from "@coordinator/web/model/deployment";
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

    private readonly deploymentDefinitionService: DeploymentDefinitionService;
    private readonly lifecycleService: LifecycleService;
    private readonly healthcheckProvider: HealthcheckProvider;
    private readonly infoProvider: InfoProvider;

    constructor(deploymentDefinitionService: DeploymentDefinitionService, lifecycleService: LifecycleService,
                healthcheckProvider: HealthcheckProvider, infoProvider: InfoProvider) {
        this.deploymentDefinitionService = deploymentDefinitionService;
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

        const deployment = await this.getDeployment(deploymentAttributes);

        return this.infoProvider.getAppInfo(deployment.id, deployment.info);
    }

    /**
     * Deploys a new version of the given deployment.
     *
     * @param deploymentAttributes DeploymentAttributes object containing the necessary parameters of selecting the relevant deployment
     */
    public async deploy(deploymentAttributes: DeploymentAttributes): Promise<OperationResult> {

        const deployment = await this.getDeployment(deploymentAttributes);
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

        const deployment = await this.getDeployment(deploymentAttributes);

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

    private async getDeployment(deploymentAttributes: DeploymentAttributes): Promise<Deployment> {

        const deployment = await this.deploymentDefinitionService.getDeployment(deploymentAttributes.deployment, false) as ExtendedDeployment;
        if (!deployment) {
            throw new UnknownDeploymentError(deploymentAttributes.deployment);
        }

        return deployment;
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

        const deployment = await this.getDeployment(deploymentAttributes);
        const operationResult = await operation(deployment);

        return operationResult.status === DeploymentStatus.UNKNOWN_STARTED
            ? await this.mapHealthcheckResponse(deployment)
            : operationResult;
    }

    private async mapHealthcheckResponse(deployment: Deployment): Promise<OperationResult> {

        return {
            deployOperation: false,
            deployedVersion: undefined,
            status: await this.healthcheckProvider.executeHealthcheck(deployment.id, deployment.healthcheck)
        };
    }
}

export const deploymentFacade = new DeploymentFacade(deploymentDefinitionService, lifecycleService, healthcheckProvider, infoProvider);
