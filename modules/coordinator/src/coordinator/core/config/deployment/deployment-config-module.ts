import { AbstractDeploymentConfigModule } from "@coordinator/core/config/deployment/abstract-deployment-config-module";
import { UnknownDeploymentError } from "@coordinator/core/error/error-types";
import { Deployment } from "@core-lib/platform/api/deployment";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Convenience wrapper class for storing and accessing the recognized deployment configurations.
 */
export class DeploymentRegistry {

    private readonly deployments: Map<string, Deployment>;

    constructor(deployments: Map<string, Deployment>) {
        this.deployments = Object.freeze(deployments);
    }

    /**
     * Returns the configuration of the given deployment.
     *
     * @param deploymentID ID of the deployment to be returned (key of the deployment configuration)
     * @throws UnknownDeploymentError if the requested deployment does not exist
     */
    public getDeployment(deploymentID: string): Deployment {

        if (!this.deployments.has(deploymentID)) {
            throw new UnknownDeploymentError(deploymentID);
        }

        return this.deployments.get(deploymentID)!;
    }

    /**
     * Returns all registered deployment definitions.
     */
    public getAllDeployments(): Deployment[] {
        return Array.from(this.deployments.values());
    }
}

/**
 * Default AbstractConfigurationModule implementation for initializing the deployment configurations from static
 * deployment configuration (YAML) file.
 */
export class DeploymentConfigModule extends AbstractDeploymentConfigModule<DeploymentRegistry> {

    constructor() {
        super("deployments", mapNode => {

            const deployments: [string, Deployment][] = Object.entries(mapNode ?? {})
                .map(([deploymentID, deployment]) => [deploymentID, this.mapDeployment(deploymentID, deployment)]);

            if (!deployments.length) {
                this.logger?.debug("No deployment definition found");
            }

            return new DeploymentRegistry(new Map<string, Deployment>(deployments));

        }, LoggerFactory.getLogger(DeploymentConfigModule));

        super.init(true);
    }
}

export const deploymentConfigModule = new DeploymentConfigModule();
