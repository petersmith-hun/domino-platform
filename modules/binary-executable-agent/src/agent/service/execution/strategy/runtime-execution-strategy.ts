import { RuntimeConfig } from "@bin-exec-agent/config/runtime-config-module";
import { SpawnControlConfig, spawnControlConfigModule } from "@bin-exec-agent/config/spawn-control-config-module";
import { SpawnParameters } from "@bin-exec-agent/domain/common";
import { executorUserRegistry, ExecutorUserRegistry } from "@bin-exec-agent/registry/executor-user-registry";
import { runtimeRegistry, RuntimeRegistry } from "@bin-exec-agent/registry/runtime-registry";
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
 * AbstractSpawningExecutionStrategy implementation handling runtime execution (filesystem/runtime) of deployment.
 */
export class RuntimeExecutionStrategy extends AbstractSpawningExecutionStrategy {

    private readonly binaryReferenceUtility: BinaryReferenceUtility;
    private readonly executorUserRegistry: ExecutorUserRegistry;
    private readonly runtimeRegistry: RuntimeRegistry;

    constructor(spawnControlConfig: SpawnControlConfig,
                binaryReferenceUtility: BinaryReferenceUtility,
                processHandler: ProcessHandler,
                executorUserRegistry: ExecutorUserRegistry,
                deploymentCoordinator: DeploymentCoordinator,
                runtimeRegistry: RuntimeRegistry) {

        super(LoggerFactory.getLogger(RuntimeExecutionStrategy), spawnControlConfig, deploymentCoordinator, processHandler);
        this.binaryReferenceUtility = binaryReferenceUtility;
        this.executorUserRegistry = executorUserRegistry;
        this.runtimeRegistry = runtimeRegistry;
    }

    /**
     * Prepares the spawn parameters following as described below:
     *  - Sets the deployment ID (for tracking purposes);
     *  - Sets the executable path to the runtime binary path;
     *  - Sets the work directory to the application's own home directory;
     *  - Sets the executor user ID;
     *  - Prepares the execution arguments based on the runtime command line template (adding the deployment-defined
     *    execution arguments and the application's executable path).
     *
     * @param deployment deployment configuration
     */
    protected prepareSpawnParameters(deployment: Deployment): SpawnParameters {

        const lifecycleBinaryReference = this.binaryReferenceUtility.createLifecycleReference(deployment);
        const runtime = this.runtimeRegistry.getRuntime(deployment.execution.runtime!);

        return {
            deploymentID: deployment.id,
            executablePath: runtime.binaryPath,
            workDirectory: lifecycleBinaryReference.workDirectory,
            userID: this.executorUserRegistry.getUser(deployment.execution.asUser!).userID,
            arguments: this.prepareArgs(deployment, runtime)
        };
    }

    private prepareArgs(deployment: Deployment, runtime: RuntimeConfig): string[] {

        const deploymentArgs = (Array.isArray(deployment.execution.args)
            ? deployment.execution.args.join(" ")
            : (deployment.execution.args ?? "")) as string;

        const resolvedCommandLine = runtime.commandLine
            .replace("{args}", deploymentArgs)
            .replace("{resource}", deployment.source.resource);

        return resolvedCommandLine.split(" ")
            .filter(arg => arg && arg.length > 0);
    }

    forExecutionType(): ExecutionType {
        return FilesystemExecutionType.RUNTIME;
    }
}

export const runtimeExecutionStrategy = new RuntimeExecutionStrategy(
    spawnControlConfigModule.getConfiguration(),
    binaryReferenceUtility,
    processHandler,
    executorUserRegistry,
    deploymentCoordinator,
    runtimeRegistry);
