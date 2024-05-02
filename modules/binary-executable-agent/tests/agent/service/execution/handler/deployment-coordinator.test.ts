import { DeploymentBinaryInstaller } from "@bin-exec-agent/service/execution/handler/deployment-binary-installer";
import { DeploymentCoordinator } from "@bin-exec-agent/service/execution/handler/deployment-coordinator";
import { DeploymentSourceHandler } from "@bin-exec-agent/service/execution/handler/deployment-source-handler";
import { BinaryReferenceUtility } from "@bin-exec-agent/utility/binary-reference-utility";
import { StorageUtility } from "@bin-exec-agent/utility/storage-utility";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import { deploymentBinaryReferenceExactVersion, deploymentDomino, deploymentVersionExact } from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentCoordinator", () => {

    let storageUtilityMock: SinonStubbedInstance<StorageUtility>;
    let binaryReferenceUtilityMock: SinonStubbedInstance<BinaryReferenceUtility>;
    let deploymentSourceHandlerMock: SinonStubbedInstance<DeploymentSourceHandler>;
    let deploymentBinaryInstallerMock: SinonStubbedInstance<DeploymentBinaryInstaller>;
    let deploymentCoordinator: DeploymentCoordinator;

    beforeEach(() => {
        storageUtilityMock = sinon.createStubInstance(StorageUtility);
        binaryReferenceUtilityMock = sinon.createStubInstance(BinaryReferenceUtility);
        deploymentSourceHandlerMock = sinon.createStubInstance(DeploymentSourceHandler);
        deploymentBinaryInstallerMock = sinon.createStubInstance(DeploymentBinaryInstaller);

        deploymentCoordinator = new DeploymentCoordinator(storageUtilityMock, binaryReferenceUtilityMock,
            deploymentSourceHandlerMock, deploymentBinaryInstallerMock);
    });

    describe("Test scenarios for #deploy", () => {

        it("should return with DEPLOYED status on success", async () => {

            // given
            binaryReferenceUtilityMock.createDeploymentReference.withArgs(deploymentDomino, deploymentVersionExact)
                .returns(deploymentBinaryReferenceExactVersion);
            deploymentSourceHandlerMock.retrieveBinary.withArgs(deploymentBinaryReferenceExactVersion)
                .resolves(true);
            deploymentBinaryInstallerMock.installBinary.withArgs(deploymentDomino, deploymentBinaryReferenceExactVersion)
                .returns(true);

            // when
            const result = await deploymentCoordinator.deploy(deploymentDomino, deploymentVersionExact);

            // then
            expect(result).toBe(DeploymentStatus.DEPLOYED);

            sinon.assert.calledWith(storageUtilityMock.createApplicationHomeSubFolder, deploymentBinaryReferenceExactVersion);
        });

        it("should return with DEPLOY_FAILED_MISSING_VERSION status on binary retrieval failure", async () => {

            // given
            binaryReferenceUtilityMock.createDeploymentReference.withArgs(deploymentDomino, deploymentVersionExact)
                .returns(deploymentBinaryReferenceExactVersion);
            deploymentSourceHandlerMock.retrieveBinary.withArgs(deploymentBinaryReferenceExactVersion)
                .resolves(false);

            // when
            const result = await deploymentCoordinator.deploy(deploymentDomino, deploymentVersionExact);

            // then
            expect(result).toBe(DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION);
        });

        it("should return with DEPLOY_FAILED_UNKNOWN status on installation failure", async () => {

            // given
            binaryReferenceUtilityMock.createDeploymentReference.withArgs(deploymentDomino, deploymentVersionExact)
                .returns(deploymentBinaryReferenceExactVersion);
            deploymentSourceHandlerMock.retrieveBinary.withArgs(deploymentBinaryReferenceExactVersion)
                .resolves(true);
            deploymentBinaryInstallerMock.installBinary.withArgs(deploymentDomino, deploymentBinaryReferenceExactVersion)
                .returns(false);

            // when
            const result = await deploymentCoordinator.deploy(deploymentDomino, deploymentVersionExact);

            // then
            expect(result).toBe(DeploymentStatus.DEPLOY_FAILED_UNKNOWN);
        });

        it("should return with DEPLOY_FAILED_UNKNOWN status on any other error", async () => {

            // given
            binaryReferenceUtilityMock.createDeploymentReference.withArgs(deploymentDomino, deploymentVersionExact)
                .returns(deploymentBinaryReferenceExactVersion);
            storageUtilityMock.createApplicationHomeSubFolder.throws(new Error("Something went wrong"));

            // when
            const result = await deploymentCoordinator.deploy(deploymentDomino, deploymentVersionExact);

            // then
            expect(result).toBe(DeploymentStatus.DEPLOY_FAILED_UNKNOWN);
        });
    });
});
