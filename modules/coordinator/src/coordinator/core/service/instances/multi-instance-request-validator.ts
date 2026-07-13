import { DeploymentAttributes } from "@coordinator/core/domain";
import { DeploymentValidationError } from "@coordinator/core/error/error-types";
import { Deployment, InstanceNamingStrategy, MultiInstanceDeployment } from "@core-lib/platform/api/deployment";

/**
 * Lifecycle request validator for multi-instance deployments.
 */
export class MultiInstanceRequestValidator {

    /**
     * Validates the given lifecycle request for multi-instance deployments.
     *
     * @param deploymentAttributes deployment attributes to be validated
     * @param deployment deployment descriptor containing the multi-instance configuration to validate against
     * @throws DeploymentValidationError if the request is invalid
     */
    public validateLifecycleRequest(deploymentAttributes: DeploymentAttributes, deployment: Deployment): void {

        this.invalidRequestPredicates().forEach(predicate => {
            const [invalid, message] = predicate(deploymentAttributes, deployment);
            if (invalid) {
                throw new DeploymentValidationError(deploymentAttributes, message);
            }
        })
    }

    private invalidRequestPredicates(): ((deploymentAttributes: DeploymentAttributes, deployment: Deployment) => [boolean, string])[] {

        return [
            (deploymentAttributes, deployment) => [
                this.isMultiInstanceEnabled(deployment) && !this.isMultiInstanceDeploymentRequested(deploymentAttributes),
                "Multi-instance deployment attribute is expected for this deployment"
            ],
            (deploymentAttributes, deployment) => [
                !this.isMultiInstanceEnabled(deployment) && this.isMultiInstanceDeploymentRequested(deploymentAttributes),
                "Multi-instance deployment is not enabled for this deployment"
            ],
            (deploymentAttributes, deployment) => [
                !(this.shouldSkipCheck(deployment) || !deploymentAttributes.roll || deploymentAttributes.instance === undefined),
                "Rolling all instances and an exact instance at once is not possible"
            ],
            (deploymentAttributes, deployment) => [
                !(this.shouldSkipCheck(deployment) || deploymentAttributes.roll || this.isValidSuffixRequested(deployment, deploymentAttributes)),
                "Requested instance suffix is not valid for this deployment"
            ]
        ];
    }

    private isMultiInstanceDeploymentRequested(deploymentAttributes: DeploymentAttributes): boolean {
        return deploymentAttributes.roll || deploymentAttributes.instance !== undefined;
    }

    private isMultiInstanceEnabled(deployment: Deployment): boolean {
        return deployment.target.multiInstance?.enabled ?? false;
    }

    private shouldSkipCheck(deployment: Deployment): boolean {
        return !this.isMultiInstanceEnabled(deployment);
    }

    private isValidSuffixRequested(deployment: Deployment, deploymentAttributes: DeploymentAttributes): boolean {

        return this.isMultiInstanceEnabled(deployment) && (
            this.isIncrementalSuffixRequested(deploymentAttributes, deployment)
            || this.isPredefinedSuffixRequested(deploymentAttributes, deployment)
        );
    }

    private isIncrementalSuffixRequested(deploymentAttributes: DeploymentAttributes, deployment: Deployment): boolean {

        const requestedSuffix = this.extractSuffix(deploymentAttributes);
        const multiInstanceConfiguration = this.getMultiInstanceConfiguration(deployment);

        return multiInstanceConfiguration.namingStrategy === InstanceNamingStrategy.INCREMENTAL_SUFFIX
            && /^[0-9]+$/.test(requestedSuffix)
            && (requestedSuffix === "0" || parseInt(requestedSuffix) < multiInstanceConfiguration.instanceCount);
    }

    private isPredefinedSuffixRequested(deploymentAttributes: DeploymentAttributes, deployment: Deployment): boolean {

        const multiInstanceConfig = this.getMultiInstanceConfiguration(deployment);

        return multiInstanceConfig.namingStrategy === InstanceNamingStrategy.CUSTOM_PREDEFINED
            && (multiInstanceConfig.definedNames?.includes(this.extractSuffix(deploymentAttributes)) ?? false);
    }

    private extractSuffix(deploymentAttributes: DeploymentAttributes): string {
        return deploymentAttributes.instance ?? "";
    }

    private getMultiInstanceConfiguration(deployment: Deployment): MultiInstanceDeployment {
        return deployment.target.multiInstance as MultiInstanceDeployment;
    }
}

export const multiInstanceValidator = new MultiInstanceRequestValidator();
