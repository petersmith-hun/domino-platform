import { InvalidMultiInstanceConfigurationError } from "@coordinator/core/error/error-types";
import {
    Deployment,
    DockerArguments,
    InstanceNamingStrategy,
    InstanceSpreadMode,
    MultiInstanceDeployment,
    SourceType
} from "@core-lib/platform/api/deployment";

/**
 * Configuration request validator for multi-instance deployments.
 */
export class MultiInstanceConfigValidator {

    /**
     * Verifies the following requirements for multi-instance deployments:
     * - Source type is Docker
     * - Instance count is at least 2
     * - Defined names are unique (if custom-predefined naming strategy is used)
     * - Defined names are not defined for incremental naming strategy
     * - Host network base port is defined for host network mode
     * - Host network base port is not defined for bridged network mode
     * - Port offset is defined for host replication spread mode
     * - Instance count matches the number of hosts for one-per-host spread mode.
     *
     * Skips verification if multi-instance is not enabled for the deployment.
     *
     * @param deployment deployment definition to check multi-instance configuration
     */
    public validateDeploymentDefinition(deployment: Deployment): void {

        if (!deployment.target.multiInstance?.enabled) {
            this.verifySingleHost(deployment);
            return;
        }

        const multiInstanceConfig = this.getMultiInstanceConfiguration(deployment);

        this.verifySourceType(deployment);
        this.verifyInstanceCount(multiInstanceConfig);
        this.verifyDefinesNames(multiInstanceConfig);
        this.verifyPortConfiguration(multiInstanceConfig, deployment);
    }

    private verifySingleHost(deployment: Deployment): void {

        this.verifyConfig(() => deployment.target.hosts.length > 1,
            "Multi-instance deployment must be enabled for multi-host deployments");
    }

    private verifySourceType(deployment: Deployment): void {

        this.verifyConfig(() => deployment.source.type !== SourceType.DOCKER,
            "Multi-instance deployments are only supported for Docker deployments");
    }

    private verifyInstanceCount(multiInstanceConfig: MultiInstanceDeployment): void {

        this.verifyConfig(() => multiInstanceConfig.instanceCount < 2,
            "Instance count must be at least 2 for multi-instance deployments");
    }

    private verifyDefinesNames(multiInstanceConfig: MultiInstanceDeployment): void {

        if (multiInstanceConfig.namingStrategy === InstanceNamingStrategy.CUSTOM_PREDEFINED) {

            this.verifyConfig(() => !multiInstanceConfig.definedNames || multiInstanceConfig.definedNames.length !== multiInstanceConfig.instanceCount,
                "Number of custom predefined instance names must match the instance count");

            this.verifyConfig(() => new Set(multiInstanceConfig.definedNames).size !== multiInstanceConfig.definedNames!.length,
                "Custom predefined instance names must be unique");

        } else {

            this.verifyConfig(() => (multiInstanceConfig.definedNames?.length ?? 0) !== 0,
                "Defined names must not be defined for incremental naming strategy");
        }
    }

    private verifyPortConfiguration(multiInstanceConfig: MultiInstanceDeployment, deployment: Deployment): void {

        const dockerArguments = deployment.execution.args as DockerArguments;

        this.verifyConfig(() => dockerArguments.networkMode === "host" && !multiInstanceConfig.hostNetworkBasePort,
            "Host network base port must be defined for host network mode");

        this.verifyConfig(() => dockerArguments.networkMode !== "host" && multiInstanceConfig.hostNetworkBasePort !== undefined,
            "Host network base port must not be defined for bridged network mode");

        this.verifyConfig(() => multiInstanceConfig.spreadMode === InstanceSpreadMode.REPLICATE && !multiInstanceConfig.portOffset,
            "Port offset must be defined for host replication spread mode");

        this.verifyConfig(() => multiInstanceConfig.spreadMode === InstanceSpreadMode.ONE_PER_HOST && multiInstanceConfig.instanceCount !== deployment.target.hosts.length,
            "Instance count must match the number of hosts for one-per-host spread mode");
    }

    private verifyConfig(invalidOnCondition: () => boolean, message: string): void {

        if (invalidOnCondition()) {
            throw new InvalidMultiInstanceConfigurationError(message);
        }
    }

    private getMultiInstanceConfiguration(deployment: Deployment): MultiInstanceDeployment {
        return deployment.target.multiInstance as MultiInstanceDeployment;
    }
}

export const multiInstanceConfigValidator = new MultiInstanceConfigValidator();
