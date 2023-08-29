import { Deployment } from "@core-lib/platform/api/deployment";
import { DeploymentVersion, OperationResult } from "@core-lib/platform/api/lifecycle";

/**
 * Interface defining the standard deployment lifecycle operations.
 * This interface can be used on both the coordinator and the agent side, with different behavior.
 */
export interface LifecycleOperation {

    /**
     * Deploys a new version of the given deployment.
     *
     * @param deployment Deployment configuration
     * @param version DeploymentVersion object containing the version to be deployed
     */
    deploy(deployment: Deployment, version: DeploymentVersion): Promise<OperationResult>;

    /**
     * Starts the deployed version of the given deployment.
     *
     * @param deployment Deployment configuration
     */
    start(deployment: Deployment): Promise<OperationResult>;

    /**
     * Stops the deployed version of the given deployment.
     *
     * @param deployment Deployment configuration
     */
    stop(deployment: Deployment): Promise<OperationResult>;

    /**
     * Restarts the deployed version of the given deployment.
     *
     * @param deployment Deployment configuration
     */
    restart(deployment: Deployment): Promise<OperationResult>;
}
