import { DockerConnectionType, DockerEngineConfig } from "@docker-agent/config/docker-engine-config-module";
import { ResponseContext } from "@docker-agent/domain";
import { DockerEngineApiClient } from "@docker-agent/service/docker/client/docker-engine-api-client";
import { DockerResponseHandler } from "@docker-agent/service/docker/response/docker-response-handler";
import {
    dockerCreateRequestExactArguments,
    dockerIdentifyRequest,
    dockerPullRequestDefinedHome,
    dockerStartRequest
} from "@testdata";
import axios, { AxiosResponse } from "axios";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";

describe("Unit tests for DockerEngineApiClient", () => {

    const socketPath = "/path/to/docker.sock";
    const tcpURL = "http://localhost:9999";
    const axiosResponse = { status: 200, data: "response" } as AxiosResponse<any>;
    const responseContext: ResponseContext<any> = {
        streamingResult: false,
        error: false,
        data: "response",
        statusCode: 200
    };

    let axiosRequestStub: SinonStub;
    let dockerResponseHandlerMock: SinonStubbedInstance<DockerResponseHandler>;
    let dockerEngineApiClient: DockerEngineApiClient;

    beforeAll(() => {
        axiosRequestStub = sinon.stub(axios, "request");
    });

    beforeEach(() => {
        axiosRequestStub.reset();
        axiosRequestStub.resolves(axiosResponse);
        dockerResponseHandlerMock = sinon.createStubInstance(DockerResponseHandler);
    });

    afterAll(() => {
        axiosRequestStub.restore();
    })

    describe("Test scenarios for #executeDockerCommand", () => {

        it("should prepare non-authenticated Docker request and request context for streaming result", async () => {

            // given
            prepareClient(DockerConnectionType.SOCKET);

            // when
            const resultPromise = dockerEngineApiClient.executeDockerCommand(dockerStartRequest);

            // then
            await wait();
            const requestContext = dockerResponseHandlerMock.readDockerResponse.getCall(0).args[0];
            requestContext.resolution(responseContext);
            const result = await resultPromise;
            const capturedAxiosConfig = axiosRequestStub.getCall(0).args[0];
            delete capturedAxiosConfig.validateStatus;

            expect(result).toStrictEqual(responseContext);
            expect(requestContext.dockerAPIVersion).toBe("Unidentified");
            expect(requestContext.dockerRequest).toStrictEqual(dockerStartRequest);
            expect(requestContext.rawResponse).toStrictEqual(axiosResponse);
            expect(capturedAxiosConfig).toStrictEqual({
                socketPath: socketPath,
                baseURL: undefined,
                method: "POST",
                url: "/v1.41/containers/app_domino/start",
                data: undefined,
                responseType: "stream",
                headers: {
                    Host: null,
                    Accept: "*/*",
                    "X-Registry-Auth": null
                }
            });
        });

        it("should prepare non-authenticated Docker request and request context for single result", async () => {

            // given
            prepareClient(DockerConnectionType.SOCKET);

            // when
            const resultPromise = dockerEngineApiClient.executeDockerCommand(dockerIdentifyRequest);

            // then
            await wait();
            const requestContext = dockerResponseHandlerMock.readDockerResponse.getCall(0).args[0];
            requestContext.resolution(responseContext);
            const result = await resultPromise;
            const capturedAxiosConfig = axiosRequestStub.getCall(0).args[0];
            delete capturedAxiosConfig.validateStatus;

            expect(result).toStrictEqual(responseContext);
            expect(requestContext.dockerAPIVersion).toBe("Unidentified");
            expect(requestContext.dockerRequest).toStrictEqual(dockerIdentifyRequest);
            expect(requestContext.rawResponse).toStrictEqual(axiosResponse);
            expect(capturedAxiosConfig).toStrictEqual({
                socketPath: socketPath,
                baseURL: undefined,
                method: "GET",
                url: "/v1.41/version",
                data: undefined,
                responseType: "json",
                headers: {
                    Host: null,
                    Accept: "*/*",
                    "X-Registry-Auth": null
                }
            });
        });

        it("should prepare request with body", async () => {

            // given
            prepareClient(DockerConnectionType.SOCKET);

            // when
            const resultPromise = dockerEngineApiClient.executeDockerCommand(dockerCreateRequestExactArguments);

            // then
            await wait();
            const requestContext = dockerResponseHandlerMock.readDockerResponse.getCall(0).args[0];
            requestContext.resolution(responseContext);
            const result = await resultPromise;
            const capturedAxiosConfig = axiosRequestStub.getCall(0).args[0];
            delete capturedAxiosConfig.validateStatus;

            expect(result).toStrictEqual(responseContext);
            expect(requestContext.dockerAPIVersion).toBe("Unidentified");
            expect(requestContext.dockerRequest).toStrictEqual(dockerCreateRequestExactArguments);
            expect(requestContext.rawResponse).toStrictEqual(axiosResponse);
            expect(capturedAxiosConfig).toStrictEqual({
                socketPath: socketPath,
                baseURL: undefined,
                method: "POST",
                url: "/v1.41/containers/create?name=app_domino1",
                data: dockerCreateRequestExactArguments.requestBody,
                responseType: "stream",
                headers: {
                    Host: null,
                    Accept: "*/*",
                    "X-Registry-Auth": null
                }
            });
        });

        it("should prepare request via TCP connection", async () => {

            // given
            prepareClient(DockerConnectionType.TCP);

            // when
            const resultPromise = dockerEngineApiClient.executeDockerCommand(dockerIdentifyRequest);

            // then
            await wait();
            const requestContext = dockerResponseHandlerMock.readDockerResponse.getCall(0).args[0];
            requestContext.resolution(responseContext);
            const result = await resultPromise;
            const capturedAxiosConfig = axiosRequestStub.getCall(0).args[0];
            delete capturedAxiosConfig.validateStatus;

            expect(result).toStrictEqual(responseContext);
            expect(requestContext.dockerAPIVersion).toBe("Unidentified");
            expect(requestContext.dockerRequest).toStrictEqual(dockerIdentifyRequest);
            expect(requestContext.rawResponse).toStrictEqual(axiosResponse);
            expect(capturedAxiosConfig).toStrictEqual({
                socketPath: undefined,
                baseURL: tcpURL,
                method: "GET",
                url: "/v1.41/version",
                data: undefined,
                responseType: "json",
                headers: {
                    Host: null,
                    Accept: "*/*",
                    "X-Registry-Auth": null
                }
            });
        });

        it("should prepare authenticated Docker request and request context", async () => {

            // given
            prepareClient(DockerConnectionType.SOCKET, true);
            dockerEngineApiClient.identifiedDockerVersion = "v1.41";

            // when
            const resultPromise = dockerEngineApiClient.executeDockerCommand(dockerPullRequestDefinedHome);

            // then
            await wait();
            const requestContext = dockerResponseHandlerMock.readDockerResponse.getCall(0).args[0];
            requestContext.resolution(responseContext);
            const result = await resultPromise;
            const capturedAxiosConfig = axiosRequestStub.getCall(0).args[0];
            delete capturedAxiosConfig.validateStatus;

            expect(result).toStrictEqual(responseContext);
            expect(requestContext.dockerAPIVersion).toBe("v1.41");
            expect(requestContext.dockerRequest).toStrictEqual(dockerPullRequestDefinedHome);
            expect(requestContext.rawResponse).toStrictEqual(axiosResponse);
            expect(capturedAxiosConfig).toStrictEqual({
                socketPath: socketPath,
                baseURL: undefined,
                method: "POST",
                url: "/v1.41/images/create?fromImage=localhost:9999/apps/domino1&tag=1.2.0",
                data: undefined,
                responseType: "stream",
                headers: {
                    Host: null,
                    Accept: "*/*",
                    "X-Registry-Auth": "eyJzZXJ2ZXJhZGRyZXNzIjoibG9jYWxob3N0Ojk5OTkiLCJ1c2VybmFtZSI6InVzZXIxIiwicGFzc3dvcmQiOiJwYXNzMSJ9"
                }
            });
        });

        it("should prepare authenticated Docker request and request context without configured server", async () => {

            // given
            prepareClient(DockerConnectionType.SOCKET);
            dockerEngineApiClient.identifiedDockerVersion = "v1.41";

            // when
            const resultPromise = dockerEngineApiClient.executeDockerCommand(dockerPullRequestDefinedHome);

            // then
            await wait();
            const requestContext = dockerResponseHandlerMock.readDockerResponse.getCall(0).args[0];
            requestContext.resolution(responseContext);
            const result = await resultPromise;
            const capturedAxiosConfig = axiosRequestStub.getCall(0).args[0];
            delete capturedAxiosConfig.validateStatus;

            expect(result).toStrictEqual(responseContext);
            expect(requestContext.dockerAPIVersion).toBe("v1.41");
            expect(requestContext.dockerRequest).toStrictEqual(dockerPullRequestDefinedHome);
            expect(requestContext.rawResponse).toStrictEqual(axiosResponse);
            expect(capturedAxiosConfig).toStrictEqual({
                socketPath: socketPath,
                baseURL: undefined,
                method: "POST",
                url: "/v1.41/images/create?fromImage=localhost:9999/apps/domino1&tag=1.2.0",
                data: undefined,
                responseType: "stream",
                headers: {
                    Host: null,
                    Accept: "*/*",
                    "X-Registry-Auth": null
                }
            });
        });

        it("should handle promise rejection by axios client", async () => {

            // given
            axiosRequestStub.reset();
            axiosRequestStub.rejects(new Error("connection error"));
            prepareClient(DockerConnectionType.SOCKET, false);
            dockerEngineApiClient.identifiedDockerVersion = "v1.41";

            // when
            const failingCall = () => dockerEngineApiClient.executeDockerCommand(dockerPullRequestDefinedHome);

            // then
            await expect(failingCall).rejects.toThrow("connection error");
        });

        function prepareClient(connectionType: DockerConnectionType, includeServers: boolean = false): void {

            dockerEngineApiClient = new DockerEngineApiClient({
                connection: {
                    connectionType: connectionType,
                    uri: connectionType === DockerConnectionType.SOCKET
                        ? socketPath
                        : tcpURL
                },
                servers: includeServers ? [{
                    host: "localhost:9999",
                    username: "user1",
                    password: "pass1"
                }, {
                    host: "localhost:10001",
                    username: "user2",
                    password: "pass2"
                }] : []
            } as DockerEngineConfig, dockerResponseHandlerMock);
        }

        const wait = async (intervalInMs: number = 100): Promise<void> => {
            return await new Promise(resolve => setTimeout(resolve, intervalInMs));
        }
    });
});
