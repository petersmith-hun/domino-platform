import { ExecutorUserRegistry } from "@bin-exec-agent/registry/executor-user-registry";
import { RuntimeRegistry } from "@bin-exec-agent/registry/runtime-registry";
import { DeploymentCoordinator } from "@bin-exec-agent/service/execution/handler/deployment-coordinator";
import { ProcessHandler } from "@bin-exec-agent/service/execution/handler/process-handler";
import { RuntimeExecutionStrategy } from "@bin-exec-agent/service/execution/strategy/runtime-execution-strategy";
import { BinaryReferenceUtility } from "@bin-exec-agent/utility/binary-reference-utility";
import { FilesystemExecutionType } from "@core-lib/platform/api/deployment";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import {
    deploymentDomino,
    deploymentLeaflet,
    deploymentLeafletNoArg,
    deploymentLeafletSingleArg,
    deploymentVersionExact,
    executorUserLeaflet,
    lifecycleBinaryReferenceLeaflet,
    runtimeConfigJava,
    spawnControlConfig,
    spawnParametersLeaflet,
    spawnParametersLeafletNoArg,
    spawnParametersLeafletSingleArg
} from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for RuntimeExecutionStrategy", () => {

    let binaryReferenceUtilityMock: SinonStubbedInstance<BinaryReferenceUtility>;
    let executorUserRegistryMock: SinonStubbedInstance<ExecutorUserRegistry>;
    let processHandlerMock: SinonStubbedInstance<ProcessHandler>;
    let deploymentCoordinatorMock: SinonStubbedInstance<DeploymentCoordinator>;
    let runtimeRegistryMock: SinonStubbedInstance<RuntimeRegistry>;
    let runtimeExecutionStrategy: RuntimeExecutionStrategy;

    beforeEach(() => {
        binaryReferenceUtilityMock = sinon.createStubInstance(BinaryReferenceUtility);
        executorUserRegistryMock = sinon.createStubInstance(ExecutorUserRegistry);
        processHandlerMock = sinon.createStubInstance(ProcessHandler);
        deploymentCoordinatorMock = sinon.createStubInstance(DeploymentCoordinator);
        runtimeRegistryMock = sinon.createStubInstance(RuntimeRegistry);

        runtimeExecutionStrategy = new RuntimeExecutionStrategy(spawnControlConfig, binaryReferenceUtilityMock,
            processHandlerMock, executorUserRegistryMock, deploymentCoordinatorMock, runtimeRegistryMock);
    });

    describe("Test scenarios for #deploy", () => {

        it("should delegate deployment command to DeploymentCoordinator", async () => {

            // given
            deploymentCoordinatorMock.deploy.withArgs(deploymentDomino, deploymentVersionExact)
                .resolves(DeploymentStatus.DEPLOYED);

            // when
            const result = await runtimeExecutionStrategy.deploy(deploymentDomino, deploymentVersionExact);

            // then
            expect(result).toBe(DeploymentStatus.DEPLOYED);
        });
    });

    describe("Test scenarios for #start", () => {

        it("should return UNKNOWN_STARTED status after successfully starting process", async () => {

            // given
            binaryReferenceUtilityMock.createLifecycleReference.withArgs(deploymentLeaflet).returns(lifecycleBinaryReferenceLeaflet);
            executorUserRegistryMock.getUser.withArgs("leaflet").returns(executorUserLeaflet);
            runtimeRegistryMock.getRuntime.withArgs("java").returns(runtimeConfigJava);
            processHandlerMock.spawn.withArgs(spawnParametersLeaflet).resolves(302);

            // when
            const result = await runtimeExecutionStrategy.start(deploymentLeaflet);

            // then
            expect(result).toBe(DeploymentStatus.UNKNOWN_STARTED);
        });

        it("should return UNKNOWN_STARTED status after successfully starting process with single argument", async () => {

            // given
            binaryReferenceUtilityMock.createLifecycleReference.withArgs(deploymentLeafletSingleArg).returns(lifecycleBinaryReferenceLeaflet);
            executorUserRegistryMock.getUser.withArgs("leaflet").returns(executorUserLeaflet);
            runtimeRegistryMock.getRuntime.withArgs("java").returns(runtimeConfigJava);
            processHandlerMock.spawn.withArgs(spawnParametersLeafletSingleArg).resolves(303);

            // when
            const result = await runtimeExecutionStrategy.start(deploymentLeafletSingleArg);

            // then
            expect(result).toBe(DeploymentStatus.UNKNOWN_STARTED);
        });

        it("should return START_FAILURE status if spawning fails", async () => {

            // given
            binaryReferenceUtilityMock.createLifecycleReference.withArgs(deploymentLeaflet).returns(lifecycleBinaryReferenceLeaflet);
            executorUserRegistryMock.getUser.withArgs("leaflet").returns(executorUserLeaflet);
            runtimeRegistryMock.getRuntime.withArgs("java").returns(runtimeConfigJava);
            processHandlerMock.spawn.withArgs(spawnParametersLeaflet).throws(new Error("Something went wrong"));

            // when
            const result = await runtimeExecutionStrategy.start(deploymentLeaflet);

            // then
            expect(result).toBe(DeploymentStatus.START_FAILURE);
        });
    });

    describe("Test scenarios for #stop", () => {

        it("should return status returned by processHandler.kill call", async () => {

            // given
            binaryReferenceUtilityMock.createLifecycleReference.withArgs(deploymentLeaflet).returns(lifecycleBinaryReferenceLeaflet);
            executorUserRegistryMock.getUser.withArgs("leaflet").returns(executorUserLeaflet);
            runtimeRegistryMock.getRuntime.withArgs("java").returns(runtimeConfigJava);
            processHandlerMock.kill.withArgs(spawnParametersLeaflet).returns(DeploymentStatus.STOPPED);

            // when
            const result = await runtimeExecutionStrategy.stop(deploymentLeaflet);

            // then
            expect(result).toBe(DeploymentStatus.STOPPED);
        });
    });

    describe("Test scenarios for #restart", () => {

        it("should return UNKNOWN_STARTED status after successfully restarting process", async () => {

            // given
            binaryReferenceUtilityMock.createLifecycleReference.withArgs(deploymentLeafletNoArg).returns(lifecycleBinaryReferenceLeaflet);
            executorUserRegistryMock.getUser.withArgs("leaflet").returns(executorUserLeaflet);
            runtimeRegistryMock.getRuntime.withArgs("java").returns(runtimeConfigJava);
            processHandlerMock.kill.withArgs(spawnParametersLeafletNoArg).returns(DeploymentStatus.STOPPED);
            processHandlerMock.spawn.withArgs(spawnParametersLeafletNoArg).resolves(304);

            // when
            const result = await runtimeExecutionStrategy.restart(deploymentLeafletNoArg);

            // then
            expect(result).toBe(DeploymentStatus.UNKNOWN_STARTED);
        });

        it("should return STOP_FAILURE status if stopping the process fails", async () => {

            // given
            binaryReferenceUtilityMock.createLifecycleReference.withArgs(deploymentLeaflet).returns(lifecycleBinaryReferenceLeaflet);
            executorUserRegistryMock.getUser.withArgs("leaflet").returns(executorUserLeaflet);
            runtimeRegistryMock.getRuntime.withArgs("java").returns(runtimeConfigJava);
            processHandlerMock.kill.withArgs(spawnParametersLeaflet).returns(DeploymentStatus.STOP_FAILURE);

            // when
            const result = await runtimeExecutionStrategy.restart(deploymentLeaflet);

            // then
            expect(result).toBe(DeploymentStatus.STOP_FAILURE);

            sinon.assert.notCalled(processHandlerMock.spawn);
        });
    });

    describe("Test scenarios for #forExecutionType", () => {

        it("should always return RUNTIME type", () => {

            // when
            const result = runtimeExecutionStrategy.forExecutionType();

            // then
            expect(result).toBe(FilesystemExecutionType.RUNTIME);
        });
    });
});
