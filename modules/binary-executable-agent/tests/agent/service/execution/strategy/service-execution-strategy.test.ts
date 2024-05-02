import { ServiceAdapterRegistry } from "@bin-exec-agent/registry/service-adapter-registry";
import { DeploymentCoordinator } from "@bin-exec-agent/service/execution/handler/deployment-coordinator";
import { SystemdServiceAdapter } from "@bin-exec-agent/service/execution/handler/service/systemd-service-adapter";
import { ServiceExecutionStrategy } from "@bin-exec-agent/service/execution/strategy/service-execution-strategy";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import { deploymentLMS, deploymentVersionExact, spawnControlConfig } from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for ServiceExecutionStrategy", () => {

    let serviceAdapterRegistryMock: SinonStubbedInstance<ServiceAdapterRegistry>;
    let systemdServiceAdapterMock: SinonStubbedInstance<SystemdServiceAdapter>;
    let deploymentCoordinatorMock: SinonStubbedInstance<DeploymentCoordinator>
    let serviceExecutionStrategy: ServiceExecutionStrategy;

    beforeEach(() => {
        serviceAdapterRegistryMock = sinon.createStubInstance(ServiceAdapterRegistry);
        systemdServiceAdapterMock = sinon.createStubInstance(SystemdServiceAdapter);
        deploymentCoordinatorMock = sinon.createStubInstance(DeploymentCoordinator);

        serviceExecutionStrategy = new ServiceExecutionStrategy(spawnControlConfig, deploymentCoordinatorMock,
            serviceAdapterRegistryMock);
    });

    describe("Test scenarios for #deploy", () => {

        it("should delegate deployment command to DeploymentCoordinator", async () => {

            // given
            deploymentCoordinatorMock.deploy.withArgs(deploymentLMS, deploymentVersionExact)
                .resolves(DeploymentStatus.DEPLOYED);

            // when
            const result = await serviceExecutionStrategy.deploy(deploymentLMS, deploymentVersionExact);

            // then
            expect(result).toBe(DeploymentStatus.DEPLOYED);
        });
    });

    describe("Test scenarios for #start", () => {

        it("should delegate start command to service adapter", async () => {

            // given
            serviceAdapterRegistryMock.getServiceAdapter.returns(systemdServiceAdapterMock);

            // when
            const result = await serviceExecutionStrategy.start(deploymentLMS);

            // then
            expect(result).toBe(DeploymentStatus.UNKNOWN_STARTED);

            sinon.assert.calledWith(systemdServiceAdapterMock.start, deploymentLMS.execution.commandName);
        });
    });

    describe("Test scenarios for #stop", () => {

        it("should delegate stop command to service adapter", async () => {

            // given
            serviceAdapterRegistryMock.getServiceAdapter.returns(systemdServiceAdapterMock);

            // when
            const result = await serviceExecutionStrategy.stop(deploymentLMS);

            // then
            expect(result).toBe(DeploymentStatus.STOPPED);

            sinon.assert.calledWith(systemdServiceAdapterMock.stop, deploymentLMS.execution.commandName);
        });
    });

    describe("Test scenarios for #restart", () => {

        it("should delegate restart command to service adapter", async () => {

            // given
            serviceAdapterRegistryMock.getServiceAdapter.returns(systemdServiceAdapterMock);

            // when
            const result = await serviceExecutionStrategy.restart(deploymentLMS);

            // then
            expect(result).toBe(DeploymentStatus.UNKNOWN_STARTED);

            sinon.assert.calledWith(systemdServiceAdapterMock.restart, deploymentLMS.execution.commandName);
        });
    });
});
