import { UnknownExecutionStrategyError } from "@bin-exec-agent/error";
import { ExecutionStrategy } from "@bin-exec-agent/service/execution/strategy";
import { directExecutionStrategy } from "@bin-exec-agent/service/execution/strategy/direct-execution-strategy";
import { runtimeExecutionStrategy } from "@bin-exec-agent/service/execution/strategy/runtime-execution-strategy";
import { serviceExecutionStrategy } from "@bin-exec-agent/service/execution/strategy/service-execution-strategy";
import { Deployment, ExecutionType } from "@core-lib/platform/api/deployment";
import { DeploymentStatus, DeploymentVersion, OperationResult } from "@core-lib/platform/api/lifecycle";
import { LifecycleOperation } from "@core-lib/platform/api/lifecycle/lifecycle-operation";

/**
 * LifecycleOperation implementation for handling filesystem based deployments.
 */
export class BinaryExecutionLifecycleOperation implements LifecycleOperation {

    private readonly executionStrategyMap: Map<ExecutionType, ExecutionStrategy>;

    constructor(executionStrategies: ExecutionStrategy[]) {
        this.executionStrategyMap = new Map<ExecutionType, ExecutionStrategy>(executionStrategies
            .map(strategy => [strategy.forExecutionType(), strategy]));
    }

    /**
     * Triggers deploying the application via the deployment configuration defined execution strategy.
     *
     * @param deployment deployment configuration
     * @param version version descriptor
     */
    async deploy(deployment: Deployment, version: DeploymentVersion): Promise<OperationResult> {

        const executionStrategy = this.getExecutionStrategy(deployment);

        return {
            deployOperation: true,
            deployedVersion: version.version ?? "latest",
            status: await executionStrategy.deploy(deployment, version)
        };
    }

    /**
     * Triggers starting the application via the deployment configuration defined execution strategy.
     *
     * @param deployment deployment configuration
     */
    async start(deployment: Deployment): Promise<OperationResult> {
        return this.callLifecycleOperation(deployment, async (executionStrategy) => await executionStrategy.start(deployment))
    }

    /**
     * Triggers stopping the application via the deployment configuration defined execution strategy.
     *
     * @param deployment deployment configuration
     */
    async stop(deployment: Deployment): Promise<OperationResult> {
        return this.callLifecycleOperation(deployment, async (executionStrategy) => await executionStrategy.stop(deployment))
    }

    /**
     * Triggers restarting the application via the deployment configuration defined execution strategy.
     *
     * @param deployment deployment configuration
     */
    async restart(deployment: Deployment): Promise<OperationResult> {
        return this.callLifecycleOperation(deployment, async (executionStrategy) => await executionStrategy.restart(deployment))
    }

    private async callLifecycleOperation(deployment: Deployment, operationCall: (executionStrategy: ExecutionStrategy) => Promise<DeploymentStatus>): Promise<OperationResult> {

        return {
            status: await operationCall(this.getExecutionStrategy(deployment)),
            deployOperation: false
        };
    }

    private getExecutionStrategy(deployment: Deployment): ExecutionStrategy {

        const executionType = deployment.execution.via;
        const executionStrategy = this.executionStrategyMap.get(executionType);

        if (!executionStrategy) {
            throw new UnknownExecutionStrategyError(executionType);
        }

        return executionStrategy;
    }
}

export const binaryExecutionLifecycleOperation = new BinaryExecutionLifecycleOperation([
    directExecutionStrategy,
    runtimeExecutionStrategy,
    serviceExecutionStrategy
]);
