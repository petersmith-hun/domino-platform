import { SpawnControlConfig, spawnControlConfigModule } from "@bin-exec-agent/config/spawn-control-config-module";
import { SpawnParameters } from "@bin-exec-agent/domain/common";
import { executorUserRegistry, ExecutorUserRegistry } from "@bin-exec-agent/registry/executor-user-registry";
import {
    deploymentCoordinator,
    DeploymentCoordinator
} from "@bin-exec-agent/service/execution/handler/deployment-coordinator";
import { processHandler, ProcessHandler } from "@bin-exec-agent/service/execution/handler/process-handler";
import {
    AbstractSpawningExecutionStrategy
} from "@bin-exec-agent/service/execution/strategy/abstract-spawning-execution-strategy";
import { binaryReferenceUtility, BinaryReferenceUtility } from "@bin-exec-agent/utility/binary-reference-utility";
import { Deployment, ExecutionType, FilesystemExecutionType } from "@core-lib/platform/api/deployment";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * AbstractSpawningExecutionStrategy implementation handling direct execution (filesystem/executable) of deployment.
 */
export class DirectExecutionStrategy extends AbstractSpawningExecutionStrategy {

    private readonly binaryReferenceUtility: BinaryReferenceUtility;
    private readonly executorUserRegistry: ExecutorUserRegistry;

    constructor(spawnControlConfig: SpawnControlConfig,
                binaryReferenceUtility: BinaryReferenceUtility,
                processHandler: ProcessHandler,
                executorUserRegistry: ExecutorUserRegistry,
                deploymentCoordinator: DeploymentCoordinator) {

        super(LoggerFactory.getLogger(DirectExecutionStrategy), spawnControlConfig, deploymentCoordinator, processHandler);
        this.binaryReferenceUtility = binaryReferenceUtility;
        this.executorUserRegistry = executorUserRegistry;
    }

    /**
     * Prepares the spawn parameters following as described below:
     *  - Sets the deployment ID (for tracking purposes);
     *  - Sets the executable path to the application's path in its own home directory;
     *  - Sets the work directory to the application's own home directory;
     *  - Sets the executor user ID;
     *  - Sets the additional command line arguments.
     *
     * @param deployment deployment configuration
     */
    protected prepareSpawnParameters(deployment: Deployment): SpawnParameters {

        const lifecycleBinaryReference = this.binaryReferenceUtility.createLifecycleReference(deployment);

        return {
            deploymentID: deployment.id,
            executablePath: lifecycleBinaryReference.applicationPath,
            workDirectory: lifecycleBinaryReference.workDirectory,
            userID: this.executorUserRegistry.getUser(deployment.execution.asUser!).userID,
            arguments: Array.isArray(deployment.execution.args)
                ? deployment.execution.args
                : [deployment.execution.args as string]
        };
    }

    forExecutionType(): ExecutionType {
        return FilesystemExecutionType.EXECUTABLE;
    }
}

export const directExecutionStrategy = new DirectExecutionStrategy(
    spawnControlConfigModule.getConfiguration(),
    binaryReferenceUtility,
    processHandler,
    executorUserRegistry,
    deploymentCoordinator);
