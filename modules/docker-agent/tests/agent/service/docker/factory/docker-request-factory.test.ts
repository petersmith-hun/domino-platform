import { DockerCommand, DockerRequest } from "@docker-agent/domain";
import {
    DockerCreateContainerRequestMapper
} from "@docker-agent/service/docker/factory/docker-create-container-request-mapper";
import { DockerRequestFactory } from "@docker-agent/service/docker/factory/docker-request-factory";
import {
    deploymentCommonHome,
    deploymentCustomImageRequest,
    deploymentDefinedHome,
    deploymentExactImageArguments,
    dockerCreateRequestCustomRequest,
    dockerCreateRequestExactArguments,
    dockerPullRequestCommonHome,
    dockerPullRequestDefinedHome,
    dockerRemoveRequestDefinedHome,
    dockerRestartRequest,
    dockerStartRequest,
    dockerStopRequest,
    exactArgumentImageRequest,
    exactVersion,
    imageNameCommonHome,
    imageNameDefinedHome
} from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DockerRequestFactory", () => {

    let dockerCreateContainerRequestMapperMock: SinonStubbedInstance<DockerCreateContainerRequestMapper>;
    let dockerRequestFactory: DockerRequestFactory;

    beforeAll(() => {
        dockerCreateContainerRequestMapperMock = sinon.createStubInstance(DockerCreateContainerRequestMapper);

        dockerRequestFactory = new DockerRequestFactory(dockerCreateContainerRequestMapperMock);
    });

    describe("Test scenarios for #createDockerContainerCreationRequest", () => {

        it("should create DockerRequest for exact arguments", () => {

            // given
            dockerCreateContainerRequestMapperMock.prepareContainerCreationRequest.withArgs(deploymentExactImageArguments)
                .returns(exactArgumentImageRequest);

            // when
            const result = dockerRequestFactory.createDockerContainerCreationRequest(imageNameDefinedHome, exactVersion.version!, deploymentExactImageArguments);

            // then
            expect(result).toStrictEqual(dockerCreateRequestExactArguments);
        });

        it("should create DockerRequest for custom container request", () => {

            // when
            const result = dockerRequestFactory.createDockerContainerCreationRequest(imageNameCommonHome, "latest", deploymentCustomImageRequest);

            // then
            expect(result).toStrictEqual(dockerCreateRequestCustomRequest);
        });
    });

    describe("Test scenarios for #createDockerPullRequest", () => {

        it("should create an image pull request for the given deployment with defined home and version", () => {

            // when
            const result = dockerRequestFactory.createDockerPullRequest(imageNameDefinedHome, exactVersion.version!, deploymentDefinedHome);

            // then
            expect(result).toStrictEqual(dockerPullRequestDefinedHome);
        });

        it("should create an image pull request for the given deployment with common home and latest version", () => {

            // when
            const result = dockerRequestFactory.createDockerPullRequest(imageNameCommonHome, "latest", deploymentCommonHome);

            // then
            expect(result).toStrictEqual(dockerPullRequestCommonHome);
        });
    });

    describe("Test scenarios for #createDockerLifecycleCommand", () => {

        type Scenario = {
            command: DockerCommand,
            expectedRequest: DockerRequest
        };

        const scenarios: Scenario[] = [
            { command: DockerCommand.START, expectedRequest: dockerStartRequest },
            { command: DockerCommand.STOP, expectedRequest: dockerStopRequest },
            { command: DockerCommand.RESTART, expectedRequest: dockerRestartRequest },
            { command: DockerCommand.REMOVE, expectedRequest: dockerRemoveRequestDefinedHome }
        ];

        scenarios.forEach(scenario => {
            it(`should create lifecycle request for applicable command: ${scenario.command.id}`, () => {

                // when
                const result = dockerRequestFactory.createDockerLifecycleCommand(deploymentDefinedHome, scenario.command);

                // then
                expect(result).toStrictEqual(scenario.expectedRequest);
            });
        });

        const invalidCommands = [
            DockerCommand.CREATE_CONTAINER,
            DockerCommand.PULL,
            DockerCommand.IDENTIFY
        ];

        invalidCommands.forEach(command => {
            it(`should throw error for non-lifecycle command: ${command.id}`, () => {

                // when
                const failingCall = () => dockerRequestFactory.createDockerLifecycleCommand(deploymentDefinedHome, command);

                // then
                expect(failingCall).toThrow(`Invalid dockerCommand=${command.id} tried to be used as lifecycle command for registration=${deploymentDefinedHome.id}`)
            });
        });
    });
});
