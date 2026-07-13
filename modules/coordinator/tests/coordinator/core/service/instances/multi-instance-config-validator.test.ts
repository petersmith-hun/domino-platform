import { MultiInstanceConfigValidator } from "@coordinator/core/service/instances/multi-instance-config-validator";
import { Deployment, InstanceNamingStrategy, InstanceSpreadMode, SourceType } from "@core-lib/platform/api/deployment";

describe("Unit tests for MultiInstanceConfigValidator", () => {

    let multiInstanceConfigValidator: MultiInstanceConfigValidator;

    beforeEach(() => {
        multiInstanceConfigValidator = new MultiInstanceConfigValidator();
    });

    describe("Test scenarios for #validateDeploymentDefinition", () => {

        type Scenario = { deployment: Deployment };

        const scenarios: Scenario[] = [
            { deployment: { target: { hosts: ["host-1"], multiInstance: { enabled: false } } } as Deployment },
            { deployment: deployment("host", 3, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.INCREMENTAL_SUFFIX, 1000, undefined, 8080) },
            { deployment: deployment("bridge", 3, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.INCREMENTAL_SUFFIX, 1000) },
            { deployment: deployment("host", 3, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.CUSTOM_PREDEFINED, 1000, ["instance-1", "instance-2", "instance-3"], 8080) },
            { deployment: deployment("bridge", 2, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.CUSTOM_PREDEFINED, 100, ["primary", "standby"]) },
            { deployment: deployment("bridge", 2, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.INCREMENTAL_SUFFIX, 500) },
            { deployment: deployment("host", 2, InstanceSpreadMode.ONE_PER_HOST, InstanceNamingStrategy.INCREMENTAL_SUFFIX, 0, undefined, 8080) },
            { deployment: deployment("bridge", 2, InstanceSpreadMode.ONE_PER_HOST, InstanceNamingStrategy.CUSTOM_PREDEFINED, 100, ["primary", "secondary"]) }
        ];

        scenarios.forEach(scenario => {
            it(`should consider the configuration valid for ${JSON.stringify(scenario.deployment)}`, () => {

                // when
                multiInstanceConfigValidator.validateDeploymentDefinition(scenario.deployment);

                // then
                // silent fallthrough expected
            });
        });

        type InvalidScenario = { deployment: Deployment, expectedError: string };

        const invalidScenarios: InvalidScenario[] = [
            {
                deployment: {
                    source: { type: SourceType.FILESYSTEM },
                    target: { multiInstance: { enabled: true, instanceCount: 2 } }
                } as Deployment, expectedError: "Multi-instance deployments are only supported for Docker deployments"
            },
            {
                deployment: {
                    target: { hosts: ["host-1", "host-2"], multiInstance: { enabled: false } }
                } as Deployment, expectedError: "Multi-instance deployment must be enabled for multi-host deployments"
            },
            {
                deployment: deployment("host", 1, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.INCREMENTAL_SUFFIX, 1000, undefined, 8080),
                expectedError: "Instance count must be at least 2 for multi-instance deployments"
            },
            {
                deployment: deployment("host", 3, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.CUSTOM_PREDEFINED, 1000, ["instance-1", "instance-2"], 8080),
                expectedError: "Number of custom predefined instance names must match the instance count"
            },
            {
                deployment: deployment("host", 3, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.CUSTOM_PREDEFINED, 1000, ["instance-1", "instance-1", "instance-2"], 8080),
                expectedError: "Custom predefined instance names must be unique"
            },
            {
                deployment: deployment("host", 3, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.INCREMENTAL_SUFFIX, 1000, ["instance-1"], 8080),
                expectedError: "Defined names must not be defined for incremental naming strategy"
            },
            {
                deployment: deployment("host", 3, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.INCREMENTAL_SUFFIX, 1000),
                expectedError: "Host network base port must be defined for host network mode"
            },
            {
                deployment: deployment("bridge", 3, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.INCREMENTAL_SUFFIX, 1000, undefined, 8080),
                expectedError: "Host network base port must not be defined for bridged network mode"
            },
            {
                deployment: deployment("host", 3, InstanceSpreadMode.REPLICATE, InstanceNamingStrategy.INCREMENTAL_SUFFIX, 0, undefined, 8080),
                expectedError: "Port offset must be defined for host replication spread mode"
            },
            {
                deployment: deployment("host", 3, InstanceSpreadMode.ONE_PER_HOST, InstanceNamingStrategy.INCREMENTAL_SUFFIX, 0, undefined, 8080),
                expectedError: "Instance count must match the number of hosts for one-per-host spread mode"
            }
        ];

        invalidScenarios.forEach(scenario => {
            it(`should throw error for invalid configuration: ${scenario.expectedError}`, () => {

                // when
                const validation = () => multiInstanceConfigValidator.validateDeploymentDefinition(scenario.deployment);

                // then
                expect(validation).toThrow(scenario.expectedError);
            });
        });


        function deployment(networkMode: string, instanceCount: number, 
                            spreadMode: InstanceSpreadMode, namingStrategy: InstanceNamingStrategy, 
                            portOffset: number, definedNames?: string[], 
                            hostNetworkBasePort?: number): Deployment {
            
            return {
                source: { type: SourceType.DOCKER },
                target: {
                    multiInstance: { 
                        enabled: true, instanceCount, spreadMode, namingStrategy, 
                        portOffset, definedNames, hostNetworkBasePort
                    },
                    hosts: ["host1", "host2"]
                },
                execution: {
                    args: { networkMode }
                }
            } as Deployment;
        }
    });
});
