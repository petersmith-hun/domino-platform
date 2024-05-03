import { StorageUtility } from "@bin-exec-agent/utility/storage-utility";
import { deploymentBinaryReferenceExactVersion, storageConfig } from "@testdata";
import fs from "node:fs";
import sinon, { SinonStub } from "sinon";

describe("Unit tests for StorageUtility", () => {

    let existsSyncStub: SinonStub;
    let mkdirSyncStub: SinonStub;
    let accessSyncStub: SinonStub;
    let storageUtility: StorageUtility;

    beforeAll(() => {
        existsSyncStub = sinon.stub(fs, "existsSync");
        mkdirSyncStub = sinon.stub(fs, "mkdirSync");
        accessSyncStub = sinon.stub(fs, "accessSync");
    });

    beforeEach(() => {
        existsSyncStub.reset();
        mkdirSyncStub.reset();
        accessSyncStub.reset();

        storageUtility = new StorageUtility(storageConfig);
    });

    afterAll(() => {
        existsSyncStub.restore();
        mkdirSyncStub.restore();
        accessSyncStub.restore();
    });

    describe("Test scenarios for #createStorage", () => {

        it("should create storage if needed", () => {

            // given
            existsSyncStub.withArgs(storageConfig.deploymentStorePath).returns(false);
            existsSyncStub.withArgs(storageConfig.applicationHomePath).returns(true);

            // when
            storageUtility.createStorage();

            // then
            sinon.assert.callCount(mkdirSyncStub, 1);
            sinon.assert.calledWith(mkdirSyncStub, storageConfig.deploymentStorePath, {
                recursive: true,
                mode: 0o644
            });
        });
    });

    describe("Test scenarios for #ensureStorageAccess", () => {

        it("should check accessibility of both main storage paths", () => {

            // when
            storageUtility.ensureStorageAccess();

            // then
            sinon.assert.callCount(accessSyncStub, 2);
            sinon.assert.calledWith(accessSyncStub, storageConfig.deploymentStorePath, fs.constants.R_OK | fs.constants.W_OK);
            sinon.assert.calledWith(accessSyncStub, storageConfig.applicationHomePath, fs.constants.R_OK | fs.constants.W_OK);
        });
    });

    describe("Test scenarios for #createApplicationHomeSubFolder", () => {

        it("should create storage and ensure accessibility", () => {

            // given
            existsSyncStub.withArgs(deploymentBinaryReferenceExactVersion.workDirectory).returns(false);

            // when
            storageUtility.createApplicationHomeSubFolder(deploymentBinaryReferenceExactVersion);

            // then
            sinon.assert.calledWith(mkdirSyncStub, deploymentBinaryReferenceExactVersion.workDirectory, {
                recursive: true,
                mode: 0o644
            });
            sinon.assert.calledWith(accessSyncStub, deploymentBinaryReferenceExactVersion.workDirectory, fs.constants.R_OK | fs.constants.W_OK);
        });

        it("should skip creating existing storage but ensure accessibility", () => {

            // given
            existsSyncStub.withArgs(deploymentBinaryReferenceExactVersion.workDirectory).returns(true);

            // when
            storageUtility.createApplicationHomeSubFolder(deploymentBinaryReferenceExactVersion);

            // then
            sinon.assert.notCalled(mkdirSyncStub);
            sinon.assert.calledWith(accessSyncStub, deploymentBinaryReferenceExactVersion.workDirectory, fs.constants.R_OK | fs.constants.W_OK);
        });
    });
});
