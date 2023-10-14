import { HttpStatus } from "@core-lib/platform/api/common";
import { Deployment } from "@core-lib/platform/api/deployment";
import { DeploymentVersion, DeploymentVersionType } from "@core-lib/platform/api/lifecycle";
import { DockerCommand, DockerRequest, ResponseContext } from "@docker-agent/domain";
import { DockerVersionResponse } from "@docker-agent/domain/response-types";

export const exactArgumentImageRequest = { HostConfig: { RestartPolicy: { Name: "unless-stopped" } } };
export const customImageRequest = { Env: { KEY1: "value1" } };

export const deploymentDefinedHome: Deployment = {
    id: "domino",
    source: {
        home: "localhost:9999/apps",
        resource: "domino1"
    },
    execution: {
        commandName: "app_domino"
    }
} as Deployment;

export const deploymentExactImageArguments: Deployment = {
    id: "domino",
    source: {
        home: "localhost:9999/apps",
        resource: "domino1"
    },
    execution: {
        commandName: "app_domino1",
        args: {
            restartPolicy: "unless-stopped"
        }
    }
} as Deployment;

export const deploymentCommonHome: Deployment = {
    id: "domino",
    source: {
        home: "",
        resource: "domino2"
    }
} as Deployment;

export const deploymentCustomImageRequest: Deployment = {
    id: "domino",
    source: {
        home: "",
        resource: "domino2"
    },
    execution: {
        commandName: "app_domino2",
        args: {
            custom: customImageRequest
        }
    }
} as Deployment;

export const latestVersion: DeploymentVersion = {
    versionType: DeploymentVersionType.LATEST
}

export const exactVersion: DeploymentVersion = {
    versionType: DeploymentVersionType.EXACT,
    version: "1.2.0"
}

export function prepareResponseContext(status: HttpStatus): ResponseContext<any> {

    return {
        statusCode: status,
        streamingResult: false,
        error: status === HttpStatus.INTERNAL_SERVER_ERROR
    }
}

export const imageNameDefinedHome = `${deploymentDefinedHome.source.home}/${deploymentDefinedHome.source.resource}`;
export const imageNameCommonHome = deploymentCommonHome.source.resource;

export const dockerCreateRequestExactArguments: DockerRequest = new DockerRequest(DockerCommand.CREATE_CONTAINER, deploymentExactImageArguments)
    .addUrlParameter("name", deploymentExactImageArguments.execution.commandName)
    .setRequestBody({
        Image: `${imageNameDefinedHome}:${exactVersion.version}`,
        ...exactArgumentImageRequest
    });
export const dockerCreateRequestCustomRequest: DockerRequest = new DockerRequest(DockerCommand.CREATE_CONTAINER, deploymentCustomImageRequest)
    .addUrlParameter("name", deploymentCustomImageRequest.execution.commandName)
    .setRequestBody({
        Image: `${imageNameCommonHome}:latest`,
        ...customImageRequest
    });

export const dockerPullRequestDefinedHome: DockerRequest = new DockerRequest(DockerCommand.PULL, deploymentDefinedHome)
    .addUrlParameter("image", imageNameDefinedHome)
    .addUrlParameter("tag", exactVersion.version!);
export const dockerPullRequestCommonHome: DockerRequest = new DockerRequest(DockerCommand.PULL, deploymentCommonHome)
    .addUrlParameter("image", imageNameCommonHome)
    .addUrlParameter("tag", "latest");
export const dockerRemoveRequestDefinedHome: DockerRequest = new DockerRequest(DockerCommand.REMOVE, deploymentDefinedHome)
    .addUrlParameter("id", deploymentDefinedHome.execution.commandName);
export const dockerRemoveRequestCommonHome: DockerRequest = new DockerRequest(DockerCommand.REMOVE, deploymentCommonHome);
export const dockerCreateRequestDefinedHome: DockerRequest = new DockerRequest(DockerCommand.CREATE_CONTAINER, deploymentDefinedHome);
export const dockerCreateRequestCommonHome: DockerRequest = new DockerRequest(DockerCommand.CREATE_CONTAINER, deploymentCommonHome);
export const dockerStartRequest: DockerRequest = new DockerRequest(DockerCommand.START, deploymentDefinedHome)
    .addUrlParameter("id", deploymentDefinedHome.execution.commandName);
export const dockerStopRequest: DockerRequest = new DockerRequest(DockerCommand.STOP, deploymentDefinedHome)
    .addUrlParameter("id", deploymentDefinedHome.execution.commandName);
export const dockerRestartRequest: DockerRequest = new DockerRequest(DockerCommand.RESTART, deploymentDefinedHome)
    .addUrlParameter("id", deploymentDefinedHome.execution.commandName);
export const dockerIdentifyRequest: DockerRequest = new DockerRequest(DockerCommand.IDENTIFY);

export const deploymentExactImageArgumentsComplete: Deployment = {
    execution: {
        args: {
            restartPolicy: "unless-stopped",
            networkMode: "host",
            environment: {
                ENV_PARAM_1: "value1",
                ENV_PARAM_2: "value2"
            },
            commandArgs: [
                "--spring.profiles.active=production",
                "--spring.config.location=/app/config/appconfig_leaflet.yml"
            ],
            volumes: {
                "/app/conf": "/config:ro",
                "/app/leaflet-storage": "/storage:rw"
            },
            ports: {
                "9082": "9082/tcp"
            }
        }
    }
} as unknown as Deployment;

export const imageRequestForCompleteArguments = {
    "Cmd": [
        "--spring.profiles.active=production",
        "--spring.config.location=/app/config/appconfig_leaflet.yml"
    ],
    "Env": [
        "ENV_PARAM_1=value1",
        "ENV_PARAM_2=value2"
    ],
    "Volumes": {
        "/config": {},
        "/storage": {}
    },
    "ExposedPorts": {
        "9082/tcp": {}
    },
    "HostConfig": {
        "Binds": [
            "/app/conf:/config:ro",
            "/app/leaflet-storage:/storage:rw"
        ],
        "NetworkMode": "host",
        "PortBindings": {
            "9082/tcp": [{
                "HostPort": "9082"
            }]
        },
        "RestartPolicy": {
            "Name": "unless-stopped"
        }
    }
};

export const dockerVersionResponse: DockerVersionResponse = {
    Version: "20.10.18",
    ApiVersion: "1.41"
}

export const dockerVersionResponseContext: ResponseContext<DockerVersionResponse> = {
    statusCode: 200,
    data: dockerVersionResponse,
    error: false,
    streamingResult: false
}
