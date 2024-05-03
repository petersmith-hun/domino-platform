import { BinaryExecutionLifecycleOperation } from "@bin-exec-agent/service/binary-execution-lifecycle-operation";
import { ExecutionStrategy } from "@bin-exec-agent/service/execution/strategy";
import { DirectExecutionStrategy } from "@bin-exec-agent/service/execution/strategy/direct-execution-strategy";
import { RuntimeExecutionStrategy } from "@bin-exec-agent/service/execution/strategy/runtime-execution-strategy";
import { ServiceExecutionStrategy } from "@bin-exec-agent/service/execution/strategy/service-execution-strategy";
import { FilesystemExecutionType } from "@core-lib/platform/api/deployment";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import {
    deploymentDomino,
    deploymentLeaflet,
    deploymentLMS,
    deploymentVersionExact,
    deploymentVersionLatest
} from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for BinaryExecutionLifecycleOperation", () => {

    let directExecutionStrategyMock: SinonStubbedInstance<ExecutionStrategy>;
    let runtimeExecutionStrategyMock: SinonStubbedInstance<ExecutionStrategy>;
    let serviceExecutionStrategyMock: SinonStubbedInstance<ExecutionStrategy>;
    let binaryExecutionLifecycleOperation: BinaryExecutionLifecycleOperation;

    beforeEach(() => {
        directExecutionStrategyMock = sinon.createStubInstance(DirectExecutionStrategy);
        runtimeExecutionStrategyMock = sinon.createStubInstance(RuntimeExecutionStrategy);
        serviceExecutionStrategyMock = sinon.createStubInstance(ServiceExecutionStrategy);

        directExecutionStrategyMock.forExecutionType.returns(FilesystemExecutionType.EXECUTABLE);
        runtimeExecutionStrategyMock.forExecutionType.returns(FilesystemExecutionType.RUNTIME);
        serviceExecutionStrategyMock.forExecutionType.returns(FilesystemExecutionType.SERVICE);

        binaryExecutionLifecycleOperation = new BinaryExecutionLifecycleOperation([
            directExecutionStrategyMock,
            runtimeExecutionStrategyMock,
            serviceExecutionStrategyMock
        ]);
    });

    describe("Test scenarios for #deploy", () => {

        it("should delegate deploy command with exact version to direct strategy", async () => {

            // given
            directExecutionStrategyMock.deploy.withArgs(deploymentDomino, deploymentVersionExact)
                .resolves(DeploymentStatus.DEPLOYED);

            // when
            const result = await binaryExecutionLifecycleOperation.deploy(deploymentDomino, deploymentVersionExact);

            // then
            expect(result).toStrictEqual({
                deployOperation: true,
                deployedVersion: "1.2.0",
                status: DeploymentStatus.DEPLOYED
            });
        });

        it("should delegate deploy command with latest version to runtime strategy", async () => {

            // given
            runtimeExecutionStrategyMock.deploy.withArgs(deploymentLeaflet, deploymentVersionLatest)
                .resolves(DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION);

            // when
            const result = await binaryExecutionLifecycleOperation.deploy(deploymentLeaflet, deploymentVersionLatest);

            // then
            expect(result).toStrictEqual({
                deployOperation: true,
                deployedVersion: "latest",
                status: DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION
            });
        });

        it("should throw error for unregistered strategy", async () => {

            // given
            binaryExecutionLifecycleOperation = new BinaryExecutionLifecycleOperation([]);

            // when
            const failingCall = () => binaryExecutionLifecycleOperation.deploy(deploymentDomino, deploymentVersionExact);

            // then
            await expect(failingCall).rejects.toThrowError("Unknown execution strategy executable");
        });
    });

    describe("Test scenarios for #start", () => {

        it("should delegate start command to service strategy", async () => {

            // given
            serviceExecutionStrategyMock.start.withArgs(deploymentLMS)
                .resolves(DeploymentStatus.UNKNOWN_STARTED);

            // when
            const result = await binaryExecutionLifecycleOperation.start(deploymentLMS);

            // then
            expect(result).toStrictEqual({
                deployOperation: false,
                status: DeploymentStatus.UNKNOWN_STARTED
            })
        });
    });

    describe("Test scenarios for #stop", () => {

        it("should delegate start command to service strategy", async () => {

            // given
            runtimeExecutionStrategyMock.stop.withArgs(deploymentLeaflet)
                .resolves(DeploymentStatus.STOPPED);

            // when
            const result = await binaryExecutionLifecycleOperation.stop(deploymentLeaflet);

            // then
            expect(result).toStrictEqual({
                deployOperation: false,
                status: DeploymentStatus.STOPPED
            })
        });
    });

    describe("Test scenarios for #restart", () => {

        it("should delegate start command to service strategy", async () => {

            // given
            directExecutionStrategyMock.restart.withArgs(deploymentDomino)
                .resolves(DeploymentStatus.START_FAILURE);

            // when
            const result = await binaryExecutionLifecycleOperation.restart(deploymentDomino);

            // then
            expect(result).toStrictEqual({
                deployOperation: false,
                status: DeploymentStatus.START_FAILURE
            })
        });
    });
});
