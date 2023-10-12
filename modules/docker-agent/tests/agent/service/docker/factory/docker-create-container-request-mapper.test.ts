import { Deployment } from "@core-lib/platform/api/deployment";
import {
    DockerCreateContainerRequestMapper
} from "@docker-agent/service/docker/factory/docker-create-container-request-mapper";
import { deploymentExactImageArgumentsComplete, imageRequestForCompleteArguments } from "@testdata";

describe("Unit tests for DockerCreateContainerRequestMapper", () => {
    
    let dockerCreateContainerRequestMapper: DockerCreateContainerRequestMapper;
    
    beforeEach(() => {
        dockerCreateContainerRequestMapper = new DockerCreateContainerRequestMapper();
    });

    describe("Test scenarios for #prepareContainerCreationRequest", () => {

        it("should convert populated configuration to request", () => {

            // when
            const result = dockerCreateContainerRequestMapper.prepareContainerCreationRequest(deploymentExactImageArgumentsComplete);

            // then
            expect(result).toStrictEqual(imageRequestForCompleteArguments);
        });

        it("should convert empty configuration", () => {

            // given
            const deployment = {
                execution: {
                    args: {}
                }
            } as unknown as Deployment;

            // when
            const result = dockerCreateContainerRequestMapper.prepareContainerCreationRequest(deployment);

            // then
            expect(result).toStrictEqual({});
        });
    });
});