import { DeploymentAttributes } from "@coordinator/core/domain";
import { DeploymentValidationError } from "@coordinator/core/error/error-types";
import {
    deploymentDefinitionService,
    DeploymentDefinitionService
} from "@coordinator/core/service/deployment-definition-service";
import {
    MultiInstanceRequestValidator,
    multiInstanceValidator
} from "@coordinator/core/service/instances/multi-instance-request-validator";
import { ExtendedDeployment } from "@coordinator/web/model/deployment";
import {
    Deployment,
    DockerArguments,
    InstanceNamingStrategy,
    InstanceSpreadMode,
    MultiInstanceDeployment
} from "@core-lib/platform/api/deployment";

/**
 * Instance resolver implementation for multi-instance deployments.
 */
export class DeploymentInstanceResolver {

    private readonly deploymentDefinitionService: DeploymentDefinitionService;
    private readonly multiInstanceValidator: MultiInstanceRequestValidator;

    constructor(deploymentDefinitionService: DeploymentDefinitionService, multiInstanceValidator: MultiInstanceRequestValidator) {
        this.deploymentDefinitionService = deploymentDefinitionService;
        this.multiInstanceValidator = multiInstanceValidator;
    }

    /**
     * Strictly resolves one instance of a deployment, regardless if it's a single- or multi-instance deployment.
     *
     * @param deploymentAttributes deployment request attributes
     */
    public async resolveSingleInstance(deploymentAttributes: DeploymentAttributes): Promise<Deployment> {

        const deployments = await this.resolveInstances(deploymentAttributes);

        if (deployments.length !== 1) {
            throw new DeploymentValidationError(deploymentAttributes, `Expected single resolved instance, got ${deployments.length}`);
        }

        return deployments[0];
    }

    /**
     * Resolves all available instances of the given deployment. Returns immediately without any alignment on the deployment
     * descriptor if it's a single-instance deployment, or splits and aligns the deployment descriptor if it's a multi-instance deployment.
     *
     * @param deploymentAttributes deployment request attributes
     */
    public async resolveInstances(deploymentAttributes: DeploymentAttributes): Promise<Deployment[]> {

        const deployment = await this.deploymentDefinitionService.getDeployment(deploymentAttributes.deployment, false) as ExtendedDeployment;
        this.multiInstanceValidator.validateLifecycleRequest(deploymentAttributes, deployment);
        const multiInstanceConfig = this.getMultiInstanceConfiguration(deployment);

        if (!multiInstanceConfig) {
            return [deployment];

        }
        const suffixes = this.calculateSuffixes(multiInstanceConfig);

        let alignedDeployments = suffixes
            .filter(suffix => deploymentAttributes.roll || suffix === deploymentAttributes.instance)
            .map(suffix => this.applySuffix(deployment, suffix))
            .map(deployment => structuredClone(deployment))
            .map((deployment, index) => this.alignDeployment(deployment, deploymentAttributes, index, suffixes))
            .flatMap(deployment => this.alignTargetHostsForReplicationSpreading(deployment));

        this.alignTargetHostsForOnePerHostSpreading(deployment, alignedDeployments);

        return alignedDeployments;
    }

    private calculateSuffixes = (multiInstance: MultiInstanceDeployment) => {

        const suffixes: string[] = [];

        if (multiInstance.namingStrategy === InstanceNamingStrategy.CUSTOM_PREDEFINED) {
            suffixes.push(...(multiInstance.definedNames ?? []));
        } else {
            for (let index = 0; index < multiInstance.instanceCount; index++) {
                suffixes.push(index.toString());
            }
        }

        return suffixes;
    }

    private alignTargetHostsForOnePerHostSpreading(deployment: Deployment, alignedDeployments: Deployment[]): void {

        const multiInstance = this.getMultiInstanceConfiguration(deployment)!;

        if (deployment.target.hosts.length > 1 && multiInstance.spreadMode === InstanceSpreadMode.ONE_PER_HOST) {
            const targetHosts = deployment.target.hosts;
            for (let index = 0; index < alignedDeployments.length; index++) {
                alignedDeployments[index].target.hosts = [targetHosts[index]];
            }
        }
    }

    private alignTargetHostsForReplicationSpreading(deployment: Deployment): Deployment[] {

        const multiInstance = this.getMultiInstanceConfiguration(deployment)!;

        if (deployment.target.hosts.length === 1 || multiInstance.spreadMode === InstanceSpreadMode.ONE_PER_HOST) {
            return [deployment];
        }

        return deployment.target.hosts
            .map(host => ({
                ...deployment,
                target: {
                    ...deployment.target,
                    hosts: [host]
                }
            }))
    }

    private applySuffix(deployment: Deployment, suffix: string): Deployment {

        return {
            ...deployment,
            execution: {
                ...deployment.execution,
                commandName: `${deployment.execution.commandName}-${suffix}`
            }
        };
    }

    private alignDeployment(deployment: Deployment, deploymentAttributes: DeploymentAttributes, index: number, suffixes: string[]): Deployment {

        const multiInstance = this.getMultiInstanceConfiguration(deployment)!;

        if (multiInstance.spreadMode === InstanceSpreadMode.ONE_PER_HOST) {
            return deployment;
        }

        const actualIndex = deploymentAttributes.roll
            ? index
            : suffixes.findIndex(suffix => suffix === deploymentAttributes.instance);

        this.alignEnvironment(deployment, actualIndex);
        this.alignPorts(deployment, actualIndex);

        return deployment;
    }

    private alignEnvironment(deployment: Deployment, index: number): void {
        const multiInstance = this.getMultiInstanceConfiguration(deployment)!;
        if (multiInstance.hostNetworkBasePort) {

            if (!(deployment.execution.args as DockerArguments)?.environment) {
                deployment.execution = {
                    ...deployment.execution,
                    args: {
                        ...deployment.execution.args,
                        environment: {}
                    }
                }
            }

            const instancePort = multiInstance.hostNetworkBasePort! + (index * multiInstance.portOffset);
            (deployment.execution.args as DockerArguments)!.environment!.INSTANCE_PORT = instancePort.toString();
            this.alignHealthCheckPort(deployment, multiInstance.hostNetworkBasePort.toString(), instancePort.toString());
        }
    }

    private alignPorts(deployment: Deployment, index: number): void {

        const multiInstance = this.getMultiInstanceConfiguration(deployment)!;
        if (!multiInstance.hostNetworkBasePort) {

            const remappedPorts: Record<string, string> = {};
            const ports = (deployment.execution.args as DockerArguments)?.ports ?? {};
            Object.keys(ports).forEach(port => {

                const originalPort = parseInt(port);
                const targetPort = ports[port];
                const mappedPort = originalPort + (index * multiInstance.portOffset);
                remappedPorts[mappedPort.toString()] = targetPort;
                this.alignHealthCheckPort(deployment, port, mappedPort.toString());
            });

            (deployment.execution.args as DockerArguments)!.ports = remappedPorts;
        }
    }

    private alignHealthCheckPort(deployment: Deployment, predefinedPort: string, alignedPort: string): void {

        if (!deployment.healthcheck.enabled || predefinedPort === alignedPort) {
            return;
        }

        if (!deployment.healthcheck.endpoint.includes(predefinedPort)) {
            return;
        }

        deployment.healthcheck.endpoint = deployment.healthcheck.endpoint.replace(predefinedPort, alignedPort);
    }

    private getMultiInstanceConfiguration(deployment: Deployment): MultiInstanceDeployment | undefined {

        return deployment.target.multiInstance?.enabled
            ? deployment.target.multiInstance as MultiInstanceDeployment
            : undefined;
    }
}

export const deploymentInstanceResolver = new DeploymentInstanceResolver(deploymentDefinitionService, multiInstanceValidator);
