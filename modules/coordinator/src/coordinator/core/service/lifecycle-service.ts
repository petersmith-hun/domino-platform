import { Deployment } from "@core-lib/platform/api/deployment";
import { DeploymentStatus, DeploymentVersion, OperationResult } from "@core-lib/platform/api/lifecycle";
import { LifecycleOperation } from "@core-lib/platform/api/lifecycle/lifecycle-operation";

/**
 * Dummy implementation of the LifecycleOperation interface.
 * Final implementation will be an integration layer with the agent coordinator.
 */
export class LifecycleService implements LifecycleOperation {

    async deploy(deployment: Deployment, version: DeploymentVersion): Promise<OperationResult> {

        return Promise.resolve({
            status: DeploymentStatus.DEPLOYED,
            deployOperation: true
        });
    }

    async start(deployment: Deployment): Promise<OperationResult> {

        return Promise.resolve({
            status: DeploymentStatus.UNKNOWN_STARTED,
            deployOperation: false
        });
    }

    async stop(deployment: Deployment): Promise<OperationResult> {

        return Promise.resolve({
            status: DeploymentStatus.UNKNOWN_STOPPED,
            deployOperation: false
        });
    }

    async restart(deployment: Deployment): Promise<OperationResult> {

        return Promise.resolve({
            status: DeploymentStatus.UNKNOWN_STARTED,
            deployOperation: false
        });
    }

}

export const lifecycleService = new LifecycleService();
