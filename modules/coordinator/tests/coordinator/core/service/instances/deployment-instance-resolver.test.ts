import { DeploymentAttributes } from "@coordinator/core/domain";
import { DeploymentValidationError, UnknownDeploymentError } from "@coordinator/core/error/error-types";
import { DeploymentDefinitionService } from "@coordinator/core/service/deployment-definition-service";
import { DeploymentInstanceResolver } from "@coordinator/core/service/instances/deployment-instance-resolver";
import { MultiInstanceRequestValidator } from "@coordinator/core/service/instances/multi-instance-request-validator";
import { ExtendedDeployment } from "@coordinator/web/model/deployment";
import {
    Deployment,
    DockerExecutionType,
    InstanceNamingStrategy,
    InstanceSpreadMode,
    SourceType
} from "@core-lib/platform/api/deployment";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentInstanceResolver", () => {

    let deploymentDefinitionServiceMock: SinonStubbedInstance<DeploymentDefinitionService>;
    let multiInstanceValidator: SinonStubbedInstance<MultiInstanceRequestValidator>;
    let deploymentInstanceResolver: DeploymentInstanceResolver;

    beforeEach(() => {
        deploymentDefinitionServiceMock = sinon.createStubInstance(DeploymentDefinitionService);
        multiInstanceValidator = sinon.createStubInstance(MultiInstanceRequestValidator);
        deploymentInstanceResolver = new DeploymentInstanceResolver(deploymentDefinitionServiceMock, multiInstanceValidator);
    });

    type Scenario = {
        network: "bridged" | "host",
        targetHostCount: number,
        targetInstanceCount: number,
        spreadMode: "replicated" | "one-per-host",
        suffix: "incremental" | "predefined",
        predefinedSuffixes: string[],
        expectations: ((scenario: Scenario) => Deployment)[],
        includePortInUtilityEndpoints?: boolean
    }

    function scenario(network: "bridged" | "host", targetHostCount: number,
                      targetInstanceCount: number, spreadMode: "replicated" | "one-per-host",
                      suffix: "incremental" | "predefined", predefinedSuffixes: string[],
                      expectations: ((scenario: Scenario) => Deployment)[], includePortInUtilityEndpoints: boolean = true): Scenario {

        return { network, targetHostCount, targetInstanceCount, spreadMode, suffix, predefinedSuffixes, expectations, includePortInUtilityEndpoints };
    }

    describe("Test scenarios for #resolveSingleInstance", () => {

        it("should return the requested single-instance deployment", async () => {

            // given
            const id = "myapp";
            const attributes = { deployment: id, roll: false };
            const deployment = { target: { multiInstance: { enabled: false } } } as ExtendedDeployment;

            deploymentDefinitionServiceMock.getDeployment.withArgs(id, false).resolves(deployment);

            // when
            const result = await deploymentInstanceResolver.resolveSingleInstance(attributes);

            // then
            expect(result).toBe(deployment);
        });

        it("should return the requested instance of multi-instance deployment", async () => {

            // given
            const id = "myapp";
            const attributes = { deployment: id, roll: false, instance: "standby-1" };
            const singleInstanceScenario = scenario("bridged", 1, 3, "replicated", "predefined", ["primary", "standby-1", "standby-2"], [
                alignedDeployment("myapp-container-primary", {}, { "8000": "8000" }, ["host-1"], "http://localhost"),
                alignedDeployment("myapp-container-standby-1", {}, { "8100": "8000" }, ["host-1"], "http://localhost"),
                alignedDeployment("myapp-container-standby-2", {}, { "8200": "8000" }, ["host-1"], "http://localhost"),
            ], false);
            const deployment = sourceDeployment(singleInstanceScenario);
            const expectedDeployment = singleInstanceScenario.expectations
                .map(expectation => expectation(singleInstanceScenario))[1];

            deploymentDefinitionServiceMock.getDeployment.withArgs(id, false).resolves(deployment);

            // when
            const result = await deploymentInstanceResolver.resolveSingleInstance(attributes);

            // then
            expect(result).toEqual(expectedDeployment);
            expect(result.execution.commandName).toEqual("myapp-container-standby-1");
        });

        it("should throw error on missing deployment", async () => {

            // given
            const id = "myapp";
            const attributes = { deployment: id, roll: false };

            deploymentDefinitionServiceMock.getDeployment.withArgs(id, false).rejects(new UnknownDeploymentError(id));

            // when
            const failingCall = () => deploymentInstanceResolver.resolveSingleInstance(attributes);

            // then
            await expect(failingCall).rejects.toThrow(UnknownDeploymentError);
        });

        it("should throw error on multiple resolved deployments", async () => {

            // given
            const id = "myapp";
            const attributes = { deployment: id, roll: true };
            const singleInstanceScenario = scenario("bridged", 1, 3, "replicated", "predefined", ["primary", "standby-1", "standby-2"], [
                alignedDeployment("myapp-container-primary", {}, { "8000": "8000" }, ["host-1"], "http://localhost:8000"),
                alignedDeployment("myapp-container-standby-1", {}, { "8100": "8000" }, ["host-1"], "http://localhost:8100"),
                alignedDeployment("myapp-container-standby-2", {}, { "8200": "8000" }, ["host-1"], "http://localhost:8200"),
            ]);
            const deployment = sourceDeployment(singleInstanceScenario);

            deploymentDefinitionServiceMock.getDeployment.withArgs(id, false).resolves(deployment);

            // when
            const failingCall = () => deploymentInstanceResolver.resolveSingleInstance(attributes);

            // then
            await expect(failingCall).rejects.toThrow(DeploymentValidationError);
            await expect(failingCall).rejects.toThrow("Requested lifecycle operation for deployment myapp with attributes [roll=true; instance=undefined] is not supported: Expected single resolved instance, got 3");
        });
    });

    describe("Test scenarios for #resolveInstances", () => {

        const scenarios: Scenario[] = [
            scenario("bridged", 1, 4, "replicated", "incremental", [], [
                alignedDeployment("myapp-container-0", {}, { "8000": "8000" }, ["host-1"], "http://localhost:8000"),
                alignedDeployment("myapp-container-1", {}, { "8100": "8000" }, ["host-1"], "http://localhost:8100"),
                alignedDeployment("myapp-container-2", {}, { "8200": "8000" }, ["host-1"], "http://localhost:8200"),
                alignedDeployment("myapp-container-3", {}, { "8300": "8000" }, ["host-1"], "http://localhost:8300")
            ]),
            scenario("bridged", 1, 3, "replicated", "predefined", ["primary", "standby-1", "standby-2"], [
                alignedDeployment("myapp-container-primary", {}, { "8000": "8000" }, ["host-1"], "http://localhost:8000"),
                alignedDeployment("myapp-container-standby-1", {}, { "8100": "8000" }, ["host-1"], "http://localhost:8100"),
                alignedDeployment("myapp-container-standby-2", {}, { "8200": "8000" }, ["host-1"], "http://localhost:8200"),
            ]),
            scenario("host", 1, 2, "replicated", "incremental", [], [
                alignedDeployment("myapp-container-0", { INSTANCE_PORT: "8000" }, {}, ["host-1"], "http://localhost:8000"),
                alignedDeployment("myapp-container-1", { INSTANCE_PORT: "8100" }, {}, ["host-1"], "http://localhost:8100")
            ]),
            scenario("host", 1, 2, "replicated", "predefined", ["primary", "standby"], [
                alignedDeployment("myapp-container-primary", { INSTANCE_PORT: "8000" }, {}, ["host-1"], "http://localhost:8000"),
                alignedDeployment("myapp-container-standby", { INSTANCE_PORT: "8100" }, {}, ["host-1"], "http://localhost:8100")
            ]),

            scenario("bridged", 2, 2, "replicated", "incremental", [], [
                alignedDeployment("myapp-container-0", {}, { "8000": "8000" }, ["host-1"], "http://localhost:8000"),
                alignedDeployment("myapp-container-0", {}, { "8000": "8000" }, ["host-2"], "http://localhost:8000"),
                alignedDeployment("myapp-container-1", {}, { "8100": "8000" }, ["host-1"], "http://localhost:8100"),
                alignedDeployment("myapp-container-1", {}, { "8100": "8000" }, ["host-2"], "http://localhost:8100")
            ]),
            scenario("host", 3, 3, "replicated", "predefined", ["primary", "standby-1", "standby-2"], [
                alignedDeployment("myapp-container-primary", { INSTANCE_PORT: "8000" }, {}, ["host-1"], "http://localhost:8000"),
                alignedDeployment("myapp-container-primary", { INSTANCE_PORT: "8000" }, {}, ["host-2"], "http://localhost:8000"),
                alignedDeployment("myapp-container-primary", { INSTANCE_PORT: "8000" }, {}, ["host-3"], "http://localhost:8000"),
                alignedDeployment("myapp-container-standby-1", { INSTANCE_PORT: "8100" }, {}, ["host-1"], "http://localhost:8100"),
                alignedDeployment("myapp-container-standby-1", { INSTANCE_PORT: "8100" }, {}, ["host-2"], "http://localhost:8100"),
                alignedDeployment("myapp-container-standby-1", { INSTANCE_PORT: "8100" }, {}, ["host-3"], "http://localhost:8100"),
                alignedDeployment("myapp-container-standby-2", { INSTANCE_PORT: "8200" }, {}, ["host-1"], "http://localhost:8200"),
                alignedDeployment("myapp-container-standby-2", { INSTANCE_PORT: "8200" }, {}, ["host-2"], "http://localhost:8200"),
                alignedDeployment("myapp-container-standby-2", { INSTANCE_PORT: "8200" }, {}, ["host-3"], "http://localhost:8200")
            ]),
            scenario("bridged", 3, 3, "one-per-host", "incremental", [], [
                alignedDeployment("myapp-container-0", {}, { "8000": "8000" }, ["host-1"], "http://localhost:8000"),
                alignedDeployment("myapp-container-1", {}, { "8000": "8000" }, ["host-2"], "http://localhost:8000"),
                alignedDeployment("myapp-container-2", {}, { "8000": "8000" }, ["host-3"], "http://localhost:8000")
            ]),
            scenario("host", 2, 2, "one-per-host", "predefined", ["primary", "standby-1"], [
                alignedDeployment("myapp-container-primary", {}, {}, ["host-1"], "http://localhost:8000"),
                alignedDeployment("myapp-container-standby-1", {}, {}, ["host-2"], "http://localhost:8000")
            ])
        ];

        scenarios.forEach(scenario => {
            it(`should resolve instance for deployment with: ${formatScenario(scenario)}`, async () => {

                // given
                const deployment = sourceDeployment(scenario);
                const deploymentAttributes: DeploymentAttributes = { deployment: "app", roll: true };
                const expectations = scenario.expectations.map(expectation => expectation(scenario));

                deploymentDefinitionServiceMock.getDeployment.withArgs("app", false).resolves(deployment);

                // when
                const result = await deploymentInstanceResolver.resolveInstances(deploymentAttributes);

                // then
                expect(result).toEqual(expectations);
            });
        });
        
        function formatScenario(scenario: Scenario): string {
            return `network=${scenario.network} | targetHostCount=${scenario.targetHostCount} | targetInstanceCount=${scenario.targetInstanceCount} `
                + `| spreadMode=${scenario.spreadMode} | suffix=${scenario.suffix} | predefinedSuffixes=${scenario.predefinedSuffixes.join(",")}`;
        }
    });

    function sourceDeployment(scenario: Scenario): ExtendedDeployment {

        return {
            id: "myapp",
            source: {
                type: SourceType.DOCKER,
                home: "localhost:9000/apps",
                resource: "myapp-image"
            },
            target: {
                hosts: Array.from({ length: scenario.targetHostCount }, (_, index) => `host-${index + 1}`),
                multiInstance: {
                    enabled: true,
                    spreadMode: scenario.spreadMode === "replicated"
                        ? InstanceSpreadMode.REPLICATE
                        : InstanceSpreadMode.ONE_PER_HOST,
                    namingStrategy: scenario.suffix === "incremental"
                        ? InstanceNamingStrategy.INCREMENTAL_SUFFIX
                        : InstanceNamingStrategy.CUSTOM_PREDEFINED,
                    hostNetworkBasePort: scenario.network === "host"
                        ? 8000
                        : undefined,
                    instanceCount: scenario.targetInstanceCount,
                    definedNames: scenario.predefinedSuffixes,
                    portOffset: 100
                }
            },
            execution: {
                via: DockerExecutionType.STANDARD,
                commandName: "myapp-container",
                args: {
                    environment: {
                        APP_PROFILE: "test"
                    },
                    ports: scenario.network === "bridged"
                        ? { "8000": "8000" }
                        : {}
                }
            },
            healthcheck: {
                enabled: true,
                endpoint: scenario.includePortInUtilityEndpoints
                    ? "http://localhost:8000/health"
                    : "http://localhost/health",
                delay: 5000,
                timeout: 3000,
                maxAttempts: 3
            },
            info: {
                enabled: true,
                endpoint: scenario.includePortInUtilityEndpoints
                    ? "http://localhost:8000/info"
                    : "http://localhost/info",
                fieldMapping: {
                    appName: "app_name"
                }
            },
            metadata: {
                locked: true,
                createdAt: new Date("2026-06-10T17:00:00.000Z"),
                updatedAt: new Date("2026-06-11T18:00:00.000Z")
            }
        };
    }

    function alignedDeployment(commandName: string, environment: Record<string, string>, ports: Record<string, string>,
                               hosts: string[], utilityBaseEndpoint: string): (_: Scenario) => ExtendedDeployment {

        return (scenario) => {

            const deployment = sourceDeployment(scenario);

            return {
                ...deployment,
                target: {
                    ...deployment.target,
                    hosts
                },
                execution: {
                    ...deployment.execution,
                    commandName,
                    args: {
                        ...deployment.execution.args,
                        environment: { APP_PROFILE: "test", ...environment },
                        ports
                    }
                },
                healthcheck: {
                    ...deployment.healthcheck,
                    endpoint: `${utilityBaseEndpoint}/health`
                },
                info: {
                    ...deployment.info,
                    endpoint: `${utilityBaseEndpoint}/info`
                },
                metadata: structuredClone(deployment.metadata)
            }
        };
    }
});
