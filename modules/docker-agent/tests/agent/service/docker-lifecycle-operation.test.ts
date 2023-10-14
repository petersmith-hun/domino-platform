import { HttpStatus } from "@core-lib/platform/api/common";
import { DeploymentStatus, OperationResult } from "@core-lib/platform/api/lifecycle";
import { DockerCommand } from "@docker-agent/domain";
import { DockerLifecycleOperation } from "@docker-agent/service/docker-lifecycle-operation";
import { DockerEngineApiClient } from "@docker-agent/service/docker/client/docker-engine-api-client";
import { DockerRequestFactory } from "@docker-agent/service/docker/factory/docker-request-factory";
import {
    deploymentCommonHome,
    deploymentDefinedHome,
    dockerCreateRequestCommonHome,
    dockerCreateRequestDefinedHome,
    dockerPullRequestCommonHome,
    dockerPullRequestDefinedHome,
    dockerRemoveRequestCommonHome,
    dockerRemoveRequestDefinedHome,
    dockerRestartRequest,
    dockerStartRequest,
    dockerStopRequest,
    exactVersion,
    imageNameCommonHome,
    imageNameDefinedHome,
    latestVersion,
    prepareResponseContext
} from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DockerLifecycleOperation", () => {

    let dockerRequestFactoryMock: SinonStubbedInstance<DockerRequestFactory>;
    let dockerEngineApiClientMock: SinonStubbedInstance<DockerEngineApiClient>;
    let dockerLifecycleOperation: DockerLifecycleOperation;

    beforeEach(() => {
        dockerRequestFactoryMock = sinon.createStubInstance(DockerRequestFactory);
        dockerEngineApiClientMock = sinon.createStubInstance(DockerEngineApiClient);

        dockerLifecycleOperation = new DockerLifecycleOperation(dockerRequestFactoryMock, dockerEngineApiClientMock);
    });

    describe("Test scenarios for #deploy", () => {

        it("should successfully first-time deploy the given deployment", async () => {

            // given
            dockerRequestFactoryMock.createDockerPullRequest.withArgs(imageNameDefinedHome, exactVersion.version, deploymentDefinedHome)
                .returns(dockerPullRequestDefinedHome);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerPullRequestDefinedHome)
                .resolves(prepareResponseContext(HttpStatus.CREATED));
            dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(deploymentDefinedHome, DockerCommand.REMOVE)
                .returns(dockerRemoveRequestDefinedHome);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerRemoveRequestDefinedHome)
                .resolves(prepareResponseContext(HttpStatus.NOT_FOUND));
            dockerRequestFactoryMock.createDockerContainerCreationRequest.withArgs(imageNameDefinedHome, exactVersion.version, deploymentDefinedHome)
                .returns(dockerCreateRequestDefinedHome);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerCreateRequestDefinedHome)
                .resolves(prepareResponseContext(HttpStatus.CREATED));

            const expectedResult = prepareOperationResult(DeploymentStatus.DEPLOYED, exactVersion.version);

            // when
            const result = await dockerLifecycleOperation.deploy(deploymentDefinedHome, exactVersion);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should successfully re-deploy the given deployment", async () => {

            // given
            dockerRequestFactoryMock.createDockerPullRequest.withArgs(imageNameCommonHome, "latest", deploymentCommonHome)
                .returns(dockerPullRequestCommonHome);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerPullRequestCommonHome)
                .resolves(prepareResponseContext(HttpStatus.CREATED));
            dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(deploymentCommonHome, DockerCommand.REMOVE)
                .returns(dockerRemoveRequestCommonHome);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerRemoveRequestCommonHome)
                .resolves(prepareResponseContext(HttpStatus.OK));
            dockerRequestFactoryMock.createDockerContainerCreationRequest.withArgs(imageNameCommonHome, "latest", deploymentCommonHome)
                .returns(dockerCreateRequestCommonHome);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerCreateRequestCommonHome)
                .resolves(prepareResponseContext(HttpStatus.CREATED));

            const expectedResult = prepareOperationResult(DeploymentStatus.DEPLOYED, "latest");

            // when
            const result = await dockerLifecycleOperation.deploy(deploymentCommonHome, latestVersion);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should handle image pull failure when version is missing", async () => {

            // given
            dockerRequestFactoryMock.createDockerPullRequest.withArgs(imageNameDefinedHome, exactVersion.version, deploymentDefinedHome)
                .returns(dockerPullRequestDefinedHome);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerPullRequestDefinedHome)
                .resolves(prepareResponseContext(HttpStatus.NOT_FOUND));

            const expectedResult = prepareOperationResult(DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION, exactVersion.version);

            // when
            const result = await dockerLifecycleOperation.deploy(deploymentDefinedHome, exactVersion);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should handle image pull failure on any other error", async () => {

            // given
            dockerRequestFactoryMock.createDockerPullRequest.withArgs(imageNameDefinedHome, exactVersion.version, deploymentDefinedHome)
                .returns(dockerPullRequestDefinedHome);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerPullRequestDefinedHome)
                .resolves(prepareResponseContext(HttpStatus.INTERNAL_SERVER_ERROR));

            const expectedResult = prepareOperationResult(DeploymentStatus.DEPLOY_FAILED_UNKNOWN, exactVersion.version);

            // when
            const result = await dockerLifecycleOperation.deploy(deploymentDefinedHome, exactVersion);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should handle container creation failure", async () => {

            // given
            dockerRequestFactoryMock.createDockerPullRequest.withArgs(imageNameDefinedHome, exactVersion.version, deploymentDefinedHome)
                .returns(dockerPullRequestDefinedHome);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerPullRequestDefinedHome)
                .resolves(prepareResponseContext(HttpStatus.CREATED));
            dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(deploymentDefinedHome, DockerCommand.REMOVE)
                .returns(dockerRemoveRequestDefinedHome);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerRemoveRequestDefinedHome)
                .resolves(prepareResponseContext(HttpStatus.NOT_FOUND));
            dockerRequestFactoryMock.createDockerContainerCreationRequest.withArgs(imageNameDefinedHome, exactVersion.version, deploymentDefinedHome)
                .returns(dockerCreateRequestDefinedHome);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerCreateRequestDefinedHome)
                .resolves(prepareResponseContext(HttpStatus.INTERNAL_SERVER_ERROR));

            const expectedResult = prepareOperationResult(DeploymentStatus.DEPLOY_FAILED_UNKNOWN, exactVersion.version);

            // when
            const result = await dockerLifecycleOperation.deploy(deploymentDefinedHome, exactVersion);

            // then
            expect(result).toStrictEqual(expectedResult);
        });
    });

    describe("Test scenarios for #start", () => {

        it("should successfully start the application", async () => {

            // given
            dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(deploymentDefinedHome, DockerCommand.START)
                .returns(dockerStartRequest);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerStartRequest)
                .resolves(prepareResponseContext(HttpStatus.CREATED));

            const expectedResult = prepareOperationResult(DeploymentStatus.UNKNOWN_STARTED);

            // when
            const result = await dockerLifecycleOperation.start(deploymentDefinedHome);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should indicate start failure", async () => {

            // given
            dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(deploymentDefinedHome, DockerCommand.START)
                .returns(dockerStartRequest);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerStartRequest)
                .resolves(prepareResponseContext(HttpStatus.INTERNAL_SERVER_ERROR));

            const expectedResult = prepareOperationResult(DeploymentStatus.START_FAILURE);

            // when
            const result = await dockerLifecycleOperation.start(deploymentDefinedHome);

            // then
            expect(result).toStrictEqual(expectedResult);
        });
    });

    describe("Test scenarios for #stop", () => {

        it("should successfully stop the application", async () => {

            // given
            dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(deploymentDefinedHome, DockerCommand.STOP)
                .returns(dockerStopRequest);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerStopRequest)
                .resolves(prepareResponseContext(HttpStatus.CREATED));

            const expectedResult = prepareOperationResult(DeploymentStatus.UNKNOWN_STOPPED);

            // when
            const result = await dockerLifecycleOperation.stop(deploymentDefinedHome);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should indicate stop failure", async () => {

            // given
            dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(deploymentDefinedHome, DockerCommand.STOP)
                .returns(dockerStopRequest);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerStopRequest)
                .resolves(prepareResponseContext(HttpStatus.INTERNAL_SERVER_ERROR));

            const expectedResult = prepareOperationResult(DeploymentStatus.STOP_FAILURE);

            // when
            const result = await dockerLifecycleOperation.stop(deploymentDefinedHome);

            // then
            expect(result).toStrictEqual(expectedResult);
        });
    });

    describe("Test scenarios for #restart", () => {

        it("should successfully restart the application", async () => {

            // given
            dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(deploymentDefinedHome, DockerCommand.RESTART)
                .returns(dockerRestartRequest);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerRestartRequest)
                .resolves(prepareResponseContext(HttpStatus.CREATED));

            const expectedResult = prepareOperationResult(DeploymentStatus.UNKNOWN_STARTED);

            // when
            const result = await dockerLifecycleOperation.restart(deploymentDefinedHome);

            // then
            expect(result).toStrictEqual(expectedResult);
        });

        it("should indicate restart failure", async () => {

            // given
            dockerRequestFactoryMock.createDockerLifecycleCommand.withArgs(deploymentDefinedHome, DockerCommand.RESTART)
                .returns(dockerRestartRequest);
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerRestartRequest)
                .resolves(prepareResponseContext(HttpStatus.INTERNAL_SERVER_ERROR));

            const expectedResult = prepareOperationResult(DeploymentStatus.START_FAILURE);

            // when
            const result = await dockerLifecycleOperation.restart(deploymentDefinedHome);

            // then
            expect(result).toStrictEqual(expectedResult);
        });
    });

    function prepareOperationResult(status: DeploymentStatus, version?: string): OperationResult {

        return {
            status: status,
            deployedVersion: version,
            deployOperation: status in [DeploymentStatus.DEPLOYED, DeploymentStatus.DEPLOY_FAILED_UNKNOWN]
        }
    }
});
