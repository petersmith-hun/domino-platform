import { SpawnControlConfig } from "@bin-exec-agent/config/spawn-control-config-module";
import { SpawnParameters } from "@bin-exec-agent/domain/common";
import { DeploymentCoordinator } from "@bin-exec-agent/service/execution/handler/deployment-coordinator";
import { ProcessHandler } from "@bin-exec-agent/service/execution/handler/process-handler";
import {
    AbstractBaseExecutionStrategy
} from "@bin-exec-agent/service/execution/strategy/abstract-base-execution-strategy";
import { Deployment } from "@core-lib/platform/api/deployment";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import { ILogObj, Logger } from "tslog";

/**
 * AbstractBaseExecutionStrategy implementation for spawning execution strategies (executable and runtime).
 */
export abstract class AbstractSpawningExecutionStrategy extends AbstractBaseExecutionStrategy {

    private readonly processHandler: ProcessHandler;

    protected constructor(logger: Logger<ILogObj>,
                          spawnControlConfig: SpawnControlConfig,
                          deploymentCoordinator: DeploymentCoordinator,
                          processHandler: ProcessHandler) {

        super(logger, spawnControlConfig, deploymentCoordinator);
        this.processHandler = processHandler;
    }

    /**
     * Starts the application specified by the passed deployment configuration, by preparing the necessary spawn
     * parameters, then calling the ProcessHandler#spawn method. Returns UNKNOWN_STARTED status on success,
     * START_FAILURE otherwise.
     *
     * @param deployment deployment configuration
     */
    async start(deployment: Deployment): Promise<DeploymentStatus> {

        this.logger.info(`Starting application ${deployment.id} ...`);
        let startStatus = DeploymentStatus.UNKNOWN_STARTED;

        try {
            const spawnParameters = this.prepareSpawnParameters(deployment);
            const pid = await this.processHandler.spawn(spawnParameters);

            this.logger.info(`Started application ${deployment.id} with PID ${pid}`);

        } catch (error: any) {
            this.logger.error(`Failed to spawn process for application ${deployment.id} - reason: ${error?.message}`);
            startStatus = DeploymentStatus.START_FAILURE;
        }

        return Promise.resolve(startStatus);
    }

    /**
     * Stops the application specified by the passed deployment configuration, by preparing the original spawn
     * parameters, then calling ProcessHandler#kill method. Returned status is defined by this latter call as well.
     *
     * @param deployment deployment configuration
     */
    async stop(deployment: Deployment): Promise<DeploymentStatus> {

        this.logger.info(`Stopping application ${deployment.id} ...`);
        const spawnParameters = this.prepareSpawnParameters(deployment);

        return Promise.resolve(this.processHandler.kill(spawnParameters));
    }

    /**
     * Defines how the process spawn parameters are formulated based on the deployment configuration.
     *
     * @param deployment deployment configuration
     * @protected protected template method for implementing classes
     */
    protected abstract prepareSpawnParameters(deployment: Deployment): SpawnParameters;
}
