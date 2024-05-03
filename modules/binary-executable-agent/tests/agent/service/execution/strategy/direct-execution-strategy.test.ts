import { ExecutorUserRegistry } from "@bin-exec-agent/registry/executor-user-registry";
import { DeploymentCoordinator } from "@bin-exec-agent/service/execution/handler/deployment-coordinator";
import { ProcessHandler } from "@bin-exec-agent/service/execution/handler/process-handler";
import { DirectExecutionStrategy } from "@bin-exec-agent/service/execution/strategy/direct-execution-strategy";
import { BinaryReferenceUtility } from "@bin-exec-agent/utility/binary-reference-utility";
import { FilesystemExecutionType } from "@core-lib/platform/api/deployment";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import {
    deploymentDomino,
    deploymentDominoMultiArgs,
    deploymentVersionExact,
    executorUserDomino,
    lifecycleBinaryReferenceDomino,
    spawnControlConfig,
    spawnParametersDomino,
    spawnParametersDominoMultiArgs
} from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DirectExecutionStrategy", () => {

    let binaryReferenceUtilityMock: SinonStubbedInstance<BinaryReferenceUtility>;
    let executorUserRegistryMock: SinonStubbedInstance<ExecutorUserRegistry>;
    let processHandlerMock: SinonStubbedInstance<ProcessHandler>;
    let deploymentCoordinatorMock: SinonStubbedInstance<DeploymentCoordinator>;
    let directExecutionStrategy: DirectExecutionStrategy;

    beforeEach(() => {
        binaryReferenceUtilityMock = sinon.createStubInstance(BinaryReferenceUtility);
        executorUserRegistryMock = sinon.createStubInstance(ExecutorUserRegistry);
        processHandlerMock = sinon.createStubInstance(ProcessHandler);
        deploymentCoordinatorMock = sinon.createStubInstance(DeploymentCoordinator);

        directExecutionStrategy = new DirectExecutionStrategy(spawnControlConfig, binaryReferenceUtilityMock,
            processHandlerMock, executorUserRegistryMock, deploymentCoordinatorMock);
    });

    describe("Test scenarios for #deploy", () => {

        it("should delegate deployment command to DeploymentCoordinator", async () => {

            // given
            deploymentCoordinatorMock.deploy.withArgs(deploymentDomino, deploymentVersionExact)
                .resolves(DeploymentStatus.DEPLOYED);

            // when
            const result = await directExecutionStrategy.deploy(deploymentDomino, deploymentVersionExact);

            // then
            expect(result).toBe(DeploymentStatus.DEPLOYED);
        });
    });

    describe("Test scenarios for #start", () => {

        it("should return UNKNOWN_STARTED status after successfully starting process", async () => {

            // given
            binaryReferenceUtilityMock.createLifecycleReference.withArgs(deploymentDomino).returns(lifecycleBinaryReferenceDomino);
            executorUserRegistryMock.getUser.withArgs("domino").returns(executorUserDomino);
            processHandlerMock.spawn.withArgs(spawnParametersDomino).resolves(300);

            // when
            const result = await directExecutionStrategy.start(deploymentDomino);

            // then
            expect(result).toBe(DeploymentStatus.UNKNOWN_STARTED);
        });

        it("should return START_FAILURE status if spawning fails", async () => {

            // given
            binaryReferenceUtilityMock.createLifecycleReference.withArgs(deploymentDomino).returns(lifecycleBinaryReferenceDomino);
            executorUserRegistryMock.getUser.withArgs("domino").returns(executorUserDomino);
            processHandlerMock.spawn.withArgs(spawnParametersDomino).throws(new Error("Something went wrong"));

            // when
            const result = await directExecutionStrategy.start(deploymentDomino);

            // then
            expect(result).toBe(DeploymentStatus.START_FAILURE);
        });
    });

    describe("Test scenarios for #stop", () => {

        it("should return status returned by processHandler.kill call", async () => {

            // given
            binaryReferenceUtilityMock.createLifecycleReference.withArgs(deploymentDomino).returns(lifecycleBinaryReferenceDomino);
            executorUserRegistryMock.getUser.withArgs("domino").returns(executorUserDomino);
            processHandlerMock.kill.withArgs(spawnParametersDomino).returns(DeploymentStatus.STOPPED);

            // when
            const result = await directExecutionStrategy.stop(deploymentDomino);

            // then
            expect(result).toBe(DeploymentStatus.STOPPED);
        });
    });

    describe("Test scenarios for #restart", () => {

        it("should return UNKNOWN_STARTED status after successfully restarting process", async () => {

            // given
            binaryReferenceUtilityMock.createLifecycleReference.withArgs(deploymentDominoMultiArgs).returns(lifecycleBinaryReferenceDomino);
            executorUserRegistryMock.getUser.withArgs("domino").returns(executorUserDomino);
            processHandlerMock.kill.withArgs(spawnParametersDominoMultiArgs).returns(DeploymentStatus.STOPPED);
            processHandlerMock.spawn.withArgs(spawnParametersDominoMultiArgs).resolves(301);

            // when
            const result = await directExecutionStrategy.restart(deploymentDominoMultiArgs);

            // then
            expect(result).toBe(DeploymentStatus.UNKNOWN_STARTED);
        });

        it("should return STOP_FAILURE status if stopping the process fails", async () => {

            // given
            binaryReferenceUtilityMock.createLifecycleReference.withArgs(deploymentDomino).returns(lifecycleBinaryReferenceDomino);
            executorUserRegistryMock.getUser.withArgs("domino").returns(executorUserDomino);
            processHandlerMock.kill.withArgs(spawnParametersDomino).returns(DeploymentStatus.STOP_FAILURE);

            // when
            const result = await directExecutionStrategy.restart(deploymentDomino);

            // then
            expect(result).toBe(DeploymentStatus.STOP_FAILURE);

            sinon.assert.notCalled(processHandlerMock.spawn);
        });
    });

    describe("Test scenarios for #forExecutionType", () => {

        it("should always return EXECUTABLE type", () => {

            // when
            const result = directExecutionStrategy.forExecutionType();

            // then
            expect(result).toBe(FilesystemExecutionType.EXECUTABLE);
        });
    });
});
