import { Deployment, ExecutionType } from "@core-lib/platform/api/deployment";
import { DeploymentStatus, DeploymentVersion } from "@core-lib/platform/api/lifecycle";

/**
 * Implementations of this interface must control deployment and lifecycle operations of different execution types.
 */
export interface ExecutionStrategy {

    /**
     * Deploys the application specified by the passed deployment configuration with the given version.
     *
     * @param deployment deployment configuration
     * @param version version of the application to be deployed
     */
    deploy(deployment: Deployment, version: DeploymentVersion): Promise<DeploymentStatus>;

    /**
     * Starts the application specified by the passed deployment configuration.
     *
     * @param deployment deployment configuration
     */
    start(deployment: Deployment): Promise<DeploymentStatus>;

    /**
     * Stops the application specified by the passed deployment configuration.
     *
     * @param deployment deployment configuration
     */
    stop(deployment: Deployment): Promise<DeploymentStatus>;

    /**
     * Restarts the application specified by the passed deployment configuration.
     *
     * @param deployment deployment configuration
     */
    restart(deployment: Deployment): Promise<DeploymentStatus>;

    /**
     * Defines the compatible ExecutionType of this implementation.
     */
    forExecutionType(): ExecutionType;
}
