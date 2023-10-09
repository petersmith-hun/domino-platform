import { Deployment, DockerArguments, MapLikeObject } from "@core-lib/platform/api/deployment";

type DockerParameter = MapLikeObject | string[] | string;
type ContainerCreationRequestMapping = {
    [key in keyof DockerArguments]: {
        [key: string]: (value: DockerParameter) => any
    }
};

const identityMapping = (value: DockerParameter) => value;

/**
 * Mapper component able to generate Docker container creation requests from Domino registration configurations.
 */
export class DockerCreateContainerRequestMapper {

    private readonly mapping: ContainerCreationRequestMapping;

    constructor() {
        this.mapping = this.setupMapping();
    }

    /**
     * Creates a Docker container creation request based on the provided Domino registration object.
     *
     * @param deployment Domino application registration object
     * @returns Docker container creation request body object
     */
    public prepareContainerCreationRequest(deployment: Deployment): object {

        const requestBody = {};
        const dockerArguments = deployment.execution.args as DockerArguments;

        Object.keys(this.mapping).forEach(configKey => {
            const dockerArgument = dockerArguments[configKey as keyof DockerArguments];
            if (dockerArgument) {
                Object.keys(this.mapping[configKey as keyof DockerArguments]!).forEach(targetNode => {
                    const targetNodePath = targetNode.split("\.");
                    const mapperFunction = this.mapping[configKey as keyof DockerArguments]![targetNode];
                    this.assignValueToLeafNode(requestBody, targetNodePath, mapperFunction(dockerArgument));
                });
            }
        });

        return requestBody;
    }

    private extractEnvironmentMappings(environmentConfigMap: DockerParameter): string[] {

        const environmentMap = environmentConfigMap as MapLikeObject;
        return Object.keys(environmentMap)
            .map(key => `${key}=${environmentMap[key]}`)
    }

    private extractVolumeMappings(volumeConfigMap: DockerParameter, asBinding: boolean): string[] | object {

        const volumeMappings: string[] | any = asBinding ? [] : {};
        const volumeMap = volumeConfigMap as MapLikeObject;

        Object.keys(volumeMap).forEach((key) => {
            if (asBinding) {
                (volumeMappings as string[]).push(`${key}:${volumeMap[key]}`);
            } else {
                volumeMappings[volumeMap[key].split(":")[0]] = {};
            }
        });

        return volumeMappings;
    }

    private extractPortMappings(portConfigMap: DockerParameter, includeHostPort: boolean): object {

        const portMappings: any = {};
        const portMap = portConfigMap as MapLikeObject;

        Object.keys(portMap).forEach((key) => {
            portMappings[portMap[key]] = includeHostPort
                ? [{ "HostPort": key }]
                : {};
        });

        return portMappings;
    }

    private assignValueToLeafNode(requestBody: any, targetNodePath: string[], valueToAssign: object): void {

        if (targetNodePath.length > 1) {
            if (!requestBody[targetNodePath[0]]) {
                requestBody[targetNodePath[0]] = {};
            }
            this.assignValueToLeafNode(requestBody[targetNodePath[0]], targetNodePath.slice(1), valueToAssign);
        } else {
            requestBody[targetNodePath[0]] = valueToAssign
        }
    }

    private setupMapping(): ContainerCreationRequestMapping {

        return {
            "commandArgs": {
                "Cmd": identityMapping
            },
            "environment": {
                "Env": (value: DockerParameter) => this.extractEnvironmentMappings(value)
            },
            "volumes": {
                "HostConfig.Binds": (value: DockerParameter) => this.extractVolumeMappings(value, true),
                "Volumes": (value: DockerParameter) => this.extractVolumeMappings(value, false)
            },
            "networkMode": {
                "HostConfig.NetworkMode": identityMapping
            },
            "ports": {
                "HostConfig.PortBindings": (value: DockerParameter) => this.extractPortMappings(value, true),
                "ExposedPorts": (value: DockerParameter) => this.extractPortMappings(value, false)
            },
            "restartPolicy": {
                "HostConfig.RestartPolicy.Name": identityMapping
            }
        };
    }
}

export const dockerCreateContainerRequestMapper = new DockerCreateContainerRequestMapper();
