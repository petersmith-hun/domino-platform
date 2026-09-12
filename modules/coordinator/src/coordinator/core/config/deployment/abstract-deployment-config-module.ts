import {
    Deployment,
    DeploymentExecution,
    DeploymentHealthcheck,
    DeploymentInfo,
    DeploymentSource,
    DeploymentTarget,
    DisabledDeploymentOperation,
    DockerArguments,
    DockerExecutionType,
    EnabledDeploymentOperation,
    FilesystemExecutionType,
    InstanceNamingStrategy,
    InstanceSpreadMode,
    OptionalDeploymentHealthcheck,
    OptionalDeploymentInfo,
    OptionalMultiInstanceDeployment,
    SourceType,
    validIDMatcher
} from "@core-lib/platform/api/deployment";
import { ConfigurationModule, MapNode } from "@core-lib/platform/config";
import { ConfigurationError } from "@core-lib/platform/error";
import { matches } from "class-validator";
import ms, { StringValue } from "ms";
import { ILogObj, Logger } from "tslog";

type DeploymentKey = "source" | "target" | "execution" | "health-check" | "info";
type DeploymentSourceKey = "type" | "home" | "resource";
type DeploymentTargetKey = "hosts" | "multi-instance";
type MultiInstanceTypeKey = "instance-count" | "spread-mode" | "naming-strategy" | "defined-names" | "port-offset" | "host-network-base-port";
type DeploymentExecutionKey = "via" | "command-name" | "as-user" | "args" | "runtime";
type DeploymentDockerExecutionKey =
    "restart-policy"
    | "network-mode"
    | "ports"
    | "environment"
    | "command-args"
    | "volumes"
    | "custom";
type DeploymentOptionalOperationKey = "enabled";
type DeploymentInfoKey = "endpoint" | "field-mapping";
type DeploymentHealthCheckKey = "delay" | "timeout" | "max-attempts" | "endpoint";

type DeploymentKeyCompound =
    DeploymentKey
    | DeploymentSourceKey
    | DeploymentTargetKey
    | MultiInstanceTypeKey
    | DeploymentExecutionKey
    | DeploymentDockerExecutionKey
    | DeploymentOptionalOperationKey
    | DeploymentInfoKey
    | DeploymentHealthCheckKey;

/**
 * Abstract base ConfigurationModule implementation for initializing the deployment configurations from different sources.
 */
export abstract class AbstractDeploymentConfigModule<T> extends ConfigurationModule<T, DeploymentKeyCompound> {

    protected constructor(configurationNode: string | null, supplierFunction: (mapNode: MapNode) => T,
                          logger: Logger<ILogObj> | undefined = undefined, fatalOnError: boolean = true) {
        super(configurationNode ?? "", supplierFunction, logger, fatalOnError);
    }

    protected mapDeployment(deploymentID: string, deployment: MapNode): Deployment {

        this.validateDeploymentID(deploymentID);

        const deploymentSource = this.mapDeploymentSource(deployment);

        const parsedDeployment: Deployment = {
            id: deploymentID,
            source: deploymentSource,
            target: this.mapDeploymentTarget(deployment),
            execution: this.mapDeploymentExecution(deployment, deploymentSource),
            healthcheck: this.mapDeploymentHealthcheck(deployment),
            info: this.mapDeploymentInfo(deployment)
        };

        this.logger?.debug(`Registered static deployment definition ${parsedDeployment.id} of type ${parsedDeployment.source.type}/${parsedDeployment.execution.via}`);

        return parsedDeployment;
    }

    private validateDeploymentID(deploymentID: string) {

        if (!matches(deploymentID, validIDMatcher)) {
            throw new ConfigurationError(`Invalid deployment ID '${deploymentID}', must match ${validIDMatcher}`);
        }
    }

    private mapDeploymentSource(deployment: MapNode): DeploymentSource {

        const source = super.getNode(deployment, "source");

        return {
            type: SourceType[(super.getMandatoryValue(source, "type") as string).toUpperCase() as keyof typeof SourceType],
            home: super.getMandatoryValue(source, "home"),
            resource: super.getMandatoryValue(source, "resource")
        };
    }

    private mapMultiInstanceConfig(target: MapNode): OptionalMultiInstanceDeployment {

        const multiInstanceConfig = super.getNode(target, "multi-instance");

        if (!multiInstanceConfig || !this.getValue(multiInstanceConfig, "enabled")) {
            return { enabled: false };
        }

        const hostNetworkBasePort = super.getValue(multiInstanceConfig, "host-network-base-port") as string | undefined;

        return {
            enabled: true,
            instanceCount: super.getValue(multiInstanceConfig, "instance-count") as number,
            spreadMode: InstanceSpreadMode[this.extractEnumField(multiInstanceConfig, "spread-mode") as keyof typeof InstanceSpreadMode],
            namingStrategy: InstanceNamingStrategy[this.extractEnumField(multiInstanceConfig, "naming-strategy") as keyof typeof InstanceNamingStrategy],
            definedNames: (super.getValue(multiInstanceConfig, "defined-names") ?? []) as string[],
            portOffset: parseInt(super.getValue(multiInstanceConfig, "port-offset", 0) as string),
            hostNetworkBasePort: hostNetworkBasePort ? parseInt(hostNetworkBasePort) : undefined,
        };
    }

    private extractEnumField(multiInstanceConfig: MapNode, fieldName: MultiInstanceTypeKey): string {
        return (super.getValue(multiInstanceConfig, fieldName) as string).toUpperCase().replaceAll('-', '_');
    }

    private mapDeploymentTarget(deployment: MapNode): DeploymentTarget {

        const target = super.getNode(deployment, "target");

        return {
            hosts: super.getMandatoryValue(target, "hosts"),
            multiInstance: this.mapMultiInstanceConfig(target),
        };
    }

    private mapDeploymentExecution(deployment: MapNode, source: DeploymentSource): DeploymentExecution {

        const execution = super.getNode(deployment, "execution");
        const executionType = (super.getMandatoryValue(execution, "via") as string).toUpperCase();
        const isDockerDeployment = source.type === SourceType.DOCKER;

        return {
            via: isDockerDeployment
                ? DockerExecutionType[executionType as keyof typeof DockerExecutionType]
                : FilesystemExecutionType[executionType as keyof typeof FilesystemExecutionType],
            commandName: super.getMandatoryValue(execution, "command-name"),
            asUser: super.getValue(execution, "as-user"),
            runtime: super.getValue(execution, "runtime"),
            args: isDockerDeployment
                ? this.mapDockerArgs(super.getNode(execution, "args"))
                : super.getValue(execution, "args")
        };
    }

    private mapDockerArgs(dockerArgs: MapNode): DockerArguments {

        return {
            commandArgs: super.getValue(dockerArgs, "command-args"),
            environment: super.getValue(dockerArgs, "environment", {}),
            ports: super.getValue(dockerArgs, "ports", {}),
            networkMode: super.getValue(dockerArgs, "network-mode"),
            volumes: super.getValue(dockerArgs, "volumes", {}),
            restartPolicy: super.getValue(dockerArgs, "restart-policy"),
            custom: super.getValue(dockerArgs, "custom")
        }
    }

    private mapDeploymentHealthcheck(deployment: MapNode): OptionalDeploymentHealthcheck {

        const healthcheck = super.getNode(deployment, "health-check");
        const healthcheckConfigSupplier: () => DeploymentHealthcheck = () => {
            return {
                endpoint: super.getMandatoryValue(healthcheck, "endpoint"),
                delay: ms(super.getMandatoryValue(healthcheck, "delay") as StringValue),
                maxAttempts: super.getMandatoryValue(healthcheck, "max-attempts"),
                timeout: ms(super.getMandatoryValue(healthcheck, "timeout") as StringValue)
            }
        };

        return this.mapOptionalOperation(healthcheck, healthcheckConfigSupplier);
    }

    private mapDeploymentInfo(deployment: MapNode): OptionalDeploymentInfo {

        const info = super.getNode(deployment, "info");
        const infoConfigSupplier: () => DeploymentInfo = () => {
            return {
                endpoint: super.getMandatoryValue(info, "endpoint"),
                fieldMapping: super.getValue(info, "field-mapping")!
            }
        }

        return this.mapOptionalOperation(info, infoConfigSupplier);
    }

    private mapOptionalOperation<R>(operationNode: MapNode, operationConfigSupplier: () => R): (R & EnabledDeploymentOperation) | DisabledDeploymentOperation {

        return super.getMandatoryValue(operationNode, "enabled")
            ? this.mapEnabledOperation(operationConfigSupplier())
            : { enabled: false };
    }

    private mapEnabledOperation<R>(operationConfig: R): R & EnabledDeploymentOperation {
        return { enabled: true, ...operationConfig };
    }
}
