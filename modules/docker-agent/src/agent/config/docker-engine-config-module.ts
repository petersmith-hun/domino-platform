import { ConfigurationModule, MapNode } from "@core-lib/platform/config";

type DockerConnectionConfigKey = "type" | "uri";
type DockerServerConfigKey = "host" | "username" | "password";
type DockerEngineConfigNode = "connection" | "servers";
type DockerEngineConfigKey = DockerEngineConfigNode | DockerServerConfigKey | DockerConnectionConfigKey;

/**
 * Supported Docker connection types.
 */
export enum DockerConnectionType {

    /**
     * Connect to the API using a UNIX socket.
     */
    SOCKET = "socket",

    /**
     * Connect to the API using TCP (HTTP) protocol.
     */
    TCP = "tcp"
}

/**
 * Docker connection configuration parameters.
 */
export interface DockerConnection {

    /**
     * Determines how Docker Agent is going to connect to the Docker Engine API.
     */
    connectionType: DockerConnectionType;

    /**
     * Target endpoint, depending on the selected connection type.
     * Usually should be set to /var/run/docker.sock (socket) or http://localhost:2375 (tcp).
     */
    uri: string;
}

/**
 * Docker Registry server definition parameters.
 */
export interface DockerRegistryServer {

    host: string;
    username: string;
    password: string;
}

/**
 * Docker Engine configuration parameters.
 */
export interface DockerEngineConfig {

    connection: DockerConnection;
    servers: DockerRegistryServer[]
}

/**
 * ConfigurationModule implementation for setting up a Docker Engine connection.
 */
export class DockerEngineConfigModule extends ConfigurationModule<DockerEngineConfig, DockerEngineConfigKey> {

    constructor() {
        super("docker", mapNode => {
            return {
                connection: this.mapConnection(mapNode),
                servers: this.mapServers(mapNode)
            }
        });

        super.init();
    }

    private mapConnection(docker: MapNode): DockerConnection {

        const connection = super.getNode(docker, "connection");
        const connectionType = (super.getValue(connection, "type", "socket") as string).toUpperCase();

        return {
            connectionType: DockerConnectionType[connectionType as keyof typeof  DockerConnectionType],
            uri: super.getValue(connection, "uri", "/var/run/docker.sock")
        }
    }

    private mapServers(docker: MapNode): DockerRegistryServer[] {

        const servers = super.getNode(docker, "servers");

        return (servers as unknown as Array<any>)
            .map(server => {
                return {
                    host: super.getValueFromObject(server, "host"),
                    username: super.getValueFromObject(server, "username"),
                    password: super.getValueFromObject(server, "password")
                }
            });
    }
}

export const dockerEngineConfigModule = new DockerEngineConfigModule();
