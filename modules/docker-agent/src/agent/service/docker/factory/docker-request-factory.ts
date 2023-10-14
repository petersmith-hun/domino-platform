import { Deployment, DockerArguments } from "@core-lib/platform/api/deployment";
import { DockerCommand, DockerRequest } from "@docker-agent/domain";
import {
    dockerCreateContainerRequestMapper,
    DockerCreateContainerRequestMapper
} from "@docker-agent/service/docker/factory/docker-create-container-request-mapper";

/**
 * Docker Engine API request factory.
 */
export class DockerRequestFactory {

    private readonly dockerCreateContainerRequestMapper: DockerCreateContainerRequestMapper;

    constructor(dockerCreateContainerRequestMapper: DockerCreateContainerRequestMapper) {
        this.dockerCreateContainerRequestMapper = dockerCreateContainerRequestMapper;
    }

    /**
     * Builds a Docker container creation request based on the provided parameters. In case a custom creation request
     * is specified in the registration, that will be used without any modification. Otherwise, the container creation
     * request will be built by DockerCreateContainerRequestMapper.
     *
     * @param imageName name of the Docker image
     * @param tag tag of the Docker image
     * @param deployment application registration object
     * @returns created DockerRequest object containing the information to be sent to Docker Engine
     */
    public createDockerContainerCreationRequest(imageName: string, tag: string, deployment: Deployment): DockerRequest {

        const requestBody: any & { Image: string } = (deployment.execution.args as DockerArguments).custom
            || this.dockerCreateContainerRequestMapper.prepareContainerCreationRequest(deployment);

        requestBody.Image = `${imageName}:${tag}`;

        return new DockerRequest(DockerCommand.CREATE_CONTAINER, deployment)
            .addUrlParameter("name", deployment.execution.commandName)
            .setRequestBody(requestBody);
    }

    /**
     * Builds a Docker image pull request based on the provided parameters.
     *
     * @param imageName name of the Docker image
     * @param tag tag of the Docker image
     * @param deployment application registration object
     * @returns created DockerRequest object containing the information to be sent to Docker Engine
     */
    public createDockerPullRequest(imageName: string, tag: string, deployment: Deployment): DockerRequest {

        return new DockerRequest(DockerCommand.PULL, deployment)
            .addUrlParameter("image", imageName)
            .addUrlParameter("tag", tag);
    }

    /**
     * Builds a Docker lifecycle request based on the provided parameters. Accepted Docker lifecycle commands are:
     * START, STOP, RESTART, REMOVE.
     *
     * @param deployment application registration object
     * @param dockerCommand DockerCommand object defining the lifecycle command to be executed
     * @returns created DockerRequest object containing the information to be sent to Docker Engine
     */
    public createDockerLifecycleCommand(deployment: Deployment, dockerCommand: DockerCommand): DockerRequest {

        if (!dockerCommand.lifecycleCommand) {
            throw new Error(`Invalid dockerCommand=${dockerCommand.id} tried to be used as lifecycle command for registration=${deployment.id}`);
        }

        return new DockerRequest(dockerCommand, deployment)
            .addUrlParameter("id", deployment.execution.commandName);
    }
}

export const dockerRequestFactory = new DockerRequestFactory(dockerCreateContainerRequestMapper);
