import { ExecutorUserRegistry } from "@bin-exec-agent/registry/executor-user-registry";
import { DeploymentBinaryInstaller } from "@bin-exec-agent/service/execution/handler/deployment-binary-installer";
import {
    deploymentBinaryReferenceExactVersion,
    deploymentBinaryReferenceZip,
    deploymentDomino,
    deploymentLMS,
    executorUserDomino,
    executorUserLeaflet,
    spawnControlConfig,
    spawnControlConfigUnpackDisabled
} from "@testdata";
import fs from "node:fs";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentBinaryInstaller", () => {

    let copyFileSyncStub: SinonStub;
    let chmodSyncStub: SinonStub;
    let chownSyncStub: SinonStub;
    let executorUserRegistryMock: SinonStubbedInstance<ExecutorUserRegistry>;
    let deploymentBinaryInstaller: DeploymentBinaryInstaller;

    beforeAll(() => {
        copyFileSyncStub = sinon.stub(fs, "copyFileSync");
        chmodSyncStub = sinon.stub(fs, "chmodSync");
        chownSyncStub = sinon.stub(fs, "chownSync");
    });

    beforeEach(() => {
        executorUserRegistryMock = sinon.createStubInstance(ExecutorUserRegistry);
        copyFileSyncStub.reset();
        chmodSyncStub.reset();
        chownSyncStub.reset();

        deploymentBinaryInstaller = new DeploymentBinaryInstaller(spawnControlConfig, executorUserRegistryMock);
    });

    afterAll(() => {
        copyFileSyncStub.restore();
        chmodSyncStub.restore();
        chownSyncStub.restore();
    });

    describe("Test scenarios for #installBinary", () => {

        it("should install binary without unpacking", () => {

            // given
            executorUserRegistryMock.getUser.withArgs("domino").returns(executorUserDomino);

            // when
            const result = deploymentBinaryInstaller.installBinary(deploymentDomino, deploymentBinaryReferenceExactVersion);

            // then
            expect(result).toBe(true);

            sinon.assert.calledWith(copyFileSyncStub,
                deploymentBinaryReferenceExactVersion.storePath,
                deploymentBinaryReferenceExactVersion.applicationPath);
            sinon.assert.calledWith(chmodSyncStub, deploymentBinaryReferenceExactVersion.applicationPath, 0o774);
            sinon.assert.calledWith(chownSyncStub,
                deploymentBinaryReferenceExactVersion.applicationPath,
                executorUserDomino.userID, executorUserDomino.groupID);
        });

        it("should install binary with disabled unpacking", () => {

            // given
            deploymentBinaryInstaller = new DeploymentBinaryInstaller(spawnControlConfigUnpackDisabled, executorUserRegistryMock);

            executorUserRegistryMock.getUser.withArgs("leaflet").returns(executorUserLeaflet);

            // when
            const result = deploymentBinaryInstaller.installBinary(deploymentLMS, deploymentBinaryReferenceZip);

            // then
            expect(result).toBe(true);
        });


        it("should return false on error during installation", () => {

            // given
            copyFileSyncStub.throws(new Error("Something went wrong"));

            // when
            const result = deploymentBinaryInstaller.installBinary(deploymentDomino, deploymentBinaryReferenceExactVersion);

            // then
            expect(result).toBe(false);

            sinon.assert.called(copyFileSyncStub);
            sinon.assert.notCalled(chownSyncStub);
            sinon.assert.notCalled(chmodSyncStub);
        });
    });
});
