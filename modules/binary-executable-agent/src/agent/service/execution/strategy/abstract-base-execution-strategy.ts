import { SpawnControlConfig } from "@bin-exec-agent/config/spawn-control-config-module";
import { DeploymentCoordinator } from "@bin-exec-agent/service/execution/handler/deployment-coordinator";
import { ExecutionStrategy } from "@bin-exec-agent/service/execution/strategy";
import { sleep } from "@bin-exec-agent/utility";
import { Deployment, ExecutionType } from "@core-lib/platform/api/deployment";
import { DeploymentStatus, DeploymentVersion } from "@core-lib/platform/api/lifecycle";
import { ILogObj, Logger } from "tslog";

const restartableStatuses = [DeploymentStatus.UNKNOWN_STOPPED, DeploymentStatus.STOPPED];

/**
 * Abstract ExecutionStrategy implementation for all (filesystem-based) execution strategies.
 */
export abstract class AbstractBaseExecutionStrategy implements ExecutionStrategy {

    protected readonly logger: Logger<ILogObj>;

    private readonly spawnControlConfig: SpawnControlConfig;
    private readonly deploymentCoordinator: DeploymentCoordinator;

    protected constructor(logger: Logger<ILogObj>,
                          spawnControlConfig: SpawnControlConfig,
                          deploymentCoordinator: DeploymentCoordinator) {

        this.logger = logger;
        this.spawnControlConfig = spawnControlConfig;
        this.deploymentCoordinator = deploymentCoordinator;
    }

    /**
     * Deploys the application specified by the passed deployment configuration with the given version, by delegating
     * the deployment operation to the DeploymentCoordinator class.
     *
     * @param deployment deployment configuration
     * @param version version of the application to be deployed
     */
    async deploy(deployment: Deployment, version: DeploymentVersion): Promise<DeploymentStatus> {
        return this.deploymentCoordinator.deploy(deployment, version);
    }

    /**
     * Restarts the application specified by the passed deployment configuration, by first stopping it, waiting for
     * the defined start delay interval, then starting it again.
     *
     * @param deployment deployment configuration
     */
    async restart(deployment: Deployment): Promise<DeploymentStatus> {

        this.logger.info(`Waiting for the application ${deployment.id} to stop...`);
        let deploymentStatus = await this.stop(deployment);
        if (restartableStatuses.includes(deploymentStatus)) {
            this.logger.info(`Application ${deployment.id} stopped. Waiting ${this.spawnControlConfig.startDelay} ms to restart`);
            await sleep(this.spawnControlConfig.startDelay);
            deploymentStatus = await this.start(deployment);
        }

        return deploymentStatus;
    }

    abstract start(deployment: Deployment): Promise<DeploymentStatus>;
    abstract stop(deployment: Deployment): Promise<DeploymentStatus>;
    abstract forExecutionType(): ExecutionType;
}
