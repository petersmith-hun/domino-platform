import { SpawnControlConfig, spawnControlConfigModule } from "@bin-exec-agent/config/spawn-control-config-module";
import { serviceAdapterRegistry, ServiceAdapterRegistry } from "@bin-exec-agent/registry/service-adapter-registry";
import {
    deploymentCoordinator,
    DeploymentCoordinator
} from "@bin-exec-agent/service/execution/handler/deployment-coordinator";
import { ServiceAdapter } from "@bin-exec-agent/service/execution/handler/service";
import {
    AbstractBaseExecutionStrategy
} from "@bin-exec-agent/service/execution/strategy/abstract-base-execution-strategy";
import { Deployment, ExecutionType, FilesystemExecutionType } from "@core-lib/platform/api/deployment";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * AbstractSpawningExecutionStrategy implementation handling service execution (filesystem/service) of deployment.
 */
export class ServiceExecutionStrategy extends AbstractBaseExecutionStrategy {

    private readonly serviceAdapterRegistry: ServiceAdapterRegistry;
    private _serviceAdapter!: ServiceAdapter;

    constructor(spawnControlConfig: SpawnControlConfig,
                deploymentCoordinator: DeploymentCoordinator,
                serviceAdapterRegistry: ServiceAdapterRegistry) {

        super(LoggerFactory.getLogger(ServiceExecutionStrategy), spawnControlConfig, deploymentCoordinator);
        this.serviceAdapterRegistry = serviceAdapterRegistry;
    }

    /**
     * Starts the application specified by the passed deployment configuration, by calling the selected service adapter.
     *
     * @param deployment deployment configuration
     */
    async start(deployment: Deployment): Promise<DeploymentStatus> {

        this.logger.info(`Starting application ${deployment.id} via OS service ...`);
        this.serviceAdapter.start(deployment.execution.commandName);
        this.logger.info(`Started application ${deployment.id}`);

        return Promise.resolve(DeploymentStatus.UNKNOWN_STARTED);
    }

    /**
     * Stops the application specified by the passed deployment configuration, by calling the selected service adapter.
     *
     * @param deployment deployment configuration
     */
    async stop(deployment: Deployment): Promise<DeploymentStatus> {

        this.logger.info(`Stopping application ${deployment.id} via OS service ...`);
        this.serviceAdapter.stop(deployment.execution.commandName);
        this.logger.info(`Stopped application ${deployment.id}`);

        return Promise.resolve(DeploymentStatus.STOPPED);
    }

    /**
     * Restarts the application specified by the passed deployment configuration, by calling the selected service adapter.
     *
     * @param deployment deployment configuration
     */
    async restart(deployment: Deployment): Promise<DeploymentStatus> {

        this.logger.info(`Restarting application ${deployment.id} via OS service ...`);
        this.serviceAdapter.restart(deployment.execution.commandName);
        this.logger.info(`Restarted application ${deployment.id}`);

        return Promise.resolve(DeploymentStatus.UNKNOWN_STARTED);
    }

    private get serviceAdapter(): ServiceAdapter {

        if (!this._serviceAdapter) {
            this._serviceAdapter = this.serviceAdapterRegistry.getServiceAdapter();
        }

        return this._serviceAdapter;
    }

    forExecutionType(): ExecutionType {
        return FilesystemExecutionType.SERVICE;
    }
}

export const serviceExecutionStrategy = new ServiceExecutionStrategy(
    spawnControlConfigModule.getConfiguration(),
    deploymentCoordinator,
    serviceAdapterRegistry);
