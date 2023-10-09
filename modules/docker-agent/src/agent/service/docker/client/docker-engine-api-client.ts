import LoggerFactory from "@core-lib/platform/logging";
import {
    DockerConnectionType,
    DockerEngineConfig,
    dockerEngineConfigModule
} from "@docker-agent/config/docker-engine-config-module";
import { DockerRequest, ResponseContext } from "@docker-agent/domain";
import {
    dockerResponseHandler,
    DockerResponseHandler
} from "@docker-agent/service/docker/response/docker-response-handler";
import axios, { AxiosResponse } from "axios";

/**
 * API client implementation for communicating with the Docker Engine. Implementation is using Axios as the network
 * client, and is able to call the engine via UNIX socket (recommended) and TCP (HTTP) protocol as well.
 *
 * @see DockerEngineConfig
 */
export class DockerEngineApiClient {

    private readonly logger = LoggerFactory.getLogger(DockerEngineApiClient);

    private readonly dockerEngineConfig: DockerEngineConfig;
    private readonly dockerResponseHandler: DockerResponseHandler;
    private _identifiedDockerVersion?: string;

    constructor(dockerEngineConfig: DockerEngineConfig, dockerResponseHandler: DockerResponseHandler) {
        this.dockerEngineConfig = dockerEngineConfig;
        this.dockerResponseHandler = dockerResponseHandler;
    }

    /**
     * Executes the given Docker Engine request, then processes the response via DockerResponseHandler.
     *
     * @param dockerRequest DockerRequest object containing the request parameters
     */
    public async executeDockerCommand<T>(dockerRequest: DockerRequest): Promise<ResponseContext<T>> {

        return new Promise(async resolve => {
            const axiosResponse = await this.callDockerEngine(dockerRequest);
            this.dockerResponseHandler.readDockerResponse({
                dockerRequest: dockerRequest,
                rawResponse: axiosResponse,
                dockerAPIVersion: this.identifiedDockerVersion,
                resolution: resolve
            });
        });
    }

    private callDockerEngine<T>(dockerRequest: DockerRequest): Promise<AxiosResponse<T>> {

        return axios.request({
            socketPath: this.dockerEngineConfig.connection.connectionType === DockerConnectionType.SOCKET
                ? this.dockerEngineConfig.connection.uri
                : undefined,
            baseURL: this.dockerEngineConfig.connection.connectionType === DockerConnectionType.TCP
                ? this.dockerEngineConfig.connection.uri
                : undefined,
            method: dockerRequest.dockerCommand.method,
            url: this.prepareURI(dockerRequest),
            data: dockerRequest.requestBody,
            responseType: dockerRequest.dockerCommand.responseHandlerPolicy.streamResponse
                ? "stream"
                : "json",
            validateStatus: () => true,
            headers: {
                Host: null,
                Accept: "*/*",
                "X-Registry-Auth": this.prepareAuthHeader(dockerRequest)
            }
        })
    }

    private prepareURI(dockerRequest: DockerRequest): string {

        let uri = dockerRequest.dockerCommand.path;
        dockerRequest.urlParameters.forEach((value, key) => {
            uri = uri.replace(`{${key}}`, value);
        });

        return uri;
    }

    private prepareAuthHeader(dockerRequest: DockerRequest): string | null {

        let authHeader = null;
        if (dockerRequest.dockerCommand.authRequired && dockerRequest.imageHome) {

            const selectedServer = this.dockerEngineConfig.servers
                .find((server) => dockerRequest.imageHome!.startsWith(server.host));

            if (selectedServer) {
                authHeader = Buffer.from(JSON.stringify({
                    serveraddress: selectedServer.host,
                    username: selectedServer.username,
                    password: selectedServer.password
                })).toString("base64");
            } else {
                this.logger.warn(`Docker Registry credentials are not configured for registration=${dockerRequest.deploymentID} at home=${dockerRequest.imageHome}`);
            }
        }

        return authHeader;
    }


    get identifiedDockerVersion(): string {
        return this._identifiedDockerVersion ?? "Unidentified";
    }

    set identifiedDockerVersion(identifiedDockerVersion: string) {

        if (!this._identifiedDockerVersion) {
            this._identifiedDockerVersion = identifiedDockerVersion;
        }
    }
}

export const dockerEngineApiClient = new DockerEngineApiClient(dockerEngineConfigModule.getConfiguration(), dockerResponseHandler);
