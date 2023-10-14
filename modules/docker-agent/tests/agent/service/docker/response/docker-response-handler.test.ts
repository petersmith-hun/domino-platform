import { HttpStatus } from "@core-lib/platform/api/common";
import { DockerRequest, RequestContext, ResponseContext } from "@docker-agent/domain";
import { DockerResponseHandler } from "@docker-agent/service/docker/response/docker-response-handler";
import { dockerIdentifyRequest, dockerPullRequestCommonHome, dockerStartRequest } from "@testdata";
import { AxiosResponse } from "axios";

describe("Unit tests for DockerResponseHandler", () => {

    type ResponseHolder = { result?: ResponseContext<any> };

    let dockerResponseHandler: DockerResponseHandler;

    beforeEach(() => {
        dockerResponseHandler = new DockerResponseHandler();
    });

    describe("Test scenarios for #readDockerResponse", () => {

        it("should read data with single response policy and collecting the response", () => {

            // given
            const data = '{ Version: "20.0" }';
            const responseHolder: ResponseHolder = {};
            const requestContext = prepareContext(HttpStatus.OK, dockerIdentifyRequest, responseHolder, data);

            // when
            dockerResponseHandler.readDockerResponse(requestContext);

            // then
            expect(responseHolder.result).toStrictEqual({
                error: false,
                data: data,
                streamingResult: false,
                statusCode: HttpStatus.OK
            } as ResponseContext<any>);
        });

        it("should read data with streaming response policy and collecting the response", () => {

            // given
            const responseHolder: ResponseHolder = {};
            const requestContext = prepareContext(HttpStatus.CREATED, dockerStartRequest, responseHolder);
            const data1 = '{"status": "Starting", "data": "chunk #1"}';
            const data2 = '  {"status": "Starting", "data": "chunk #2"}     ';
            const data3 = '{"status": "Starting", "data": "chunk #3"}\n{"status": "Started", "message": "Container started"}';

            // when
            dockerResponseHandler.readDockerResponse(requestContext);
            requestContext.rawResponse.data.getHandler("data")(data1);
            requestContext.rawResponse.data.getHandler("data")(data2);
            requestContext.rawResponse.data.getHandler("data")(data3);
            requestContext.rawResponse.data.getHandler("end")();

            // then
            expect(responseHolder.result).toStrictEqual({
                error: false,
                data: [{
                    status: "Starting",
                    data: "chunk #1"
                }, {
                    status: "Starting",
                    data: "chunk #2"
                }, {
                    status: "Starting",
                    data: "chunk #3"
                }, {
                    status: "Started",
                    message: "Container started"
                }],
                streamingResult: true,
                statusCode: HttpStatus.CREATED
            });
        });

        it("should read data with streaming response policy and only logging the response", () => {

            // given
            const responseHolder: ResponseHolder = {};
            const requestContext = prepareContext(HttpStatus.CREATED, dockerPullRequestCommonHome, responseHolder);
            const data1 = '{"status": "Downloading", "data": "chunk #1"}';
            const data2 = '  {"status": "Downloading", "data": "chunk #2"}     ';
            const data3 = '{"status": "Downloading", "data": "chunk #3"}\n{"status": "Downloaded", "message": "Image pulled"}';

            // when
            dockerResponseHandler.readDockerResponse(requestContext);
            requestContext.rawResponse.data.getHandler("data")(data1);
            requestContext.rawResponse.data.getHandler("data")(data2);
            requestContext.rawResponse.data.getHandler("data")(data3);
            requestContext.rawResponse.data.getHandler("end")();

            // then
            expect(responseHolder.result).toStrictEqual({
                error: false,
                data: undefined,
                streamingResult: true,
                statusCode: HttpStatus.CREATED,
            });
        });

        it("should handle error response of single data command and resolve with error flag", () => {

            // given
            const responseHolder: ResponseHolder = {};
            const data = '{ message: "Not found" }';
            const requestContext = prepareContext(HttpStatus.NOT_FOUND, dockerIdentifyRequest, responseHolder, data);

            // when
            dockerResponseHandler.readDockerResponse(requestContext);

            // then
            expect(responseHolder.result).toStrictEqual({
                error: true,
                data: data,
                streamingResult: false,
                statusCode: HttpStatus.NOT_FOUND
            });
        });

        it("should handle error response of string data command and resolve with error flag", () => {

            // given
            const responseHolder: ResponseHolder = {};
            const data = '{ message: "Something went wrong" }';
            const requestContext = prepareContext(HttpStatus.INTERNAL_SERVER_ERROR, dockerStartRequest, responseHolder, data);

            // when
            dockerResponseHandler.readDockerResponse(requestContext);

            // then
            expect(responseHolder.result).toStrictEqual({
                error: true,
                data: data,
                streamingResult: true,
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR
            });
        });

        function prepareContext(status: HttpStatus, dockerRequest: DockerRequest, responseHolder: ResponseHolder, data?: string): RequestContext<any> {

            const axiosResponse = {
                status: status,
                data: data ?? new ResponseObjectMock()
            } as AxiosResponse<any>;

            return {
                rawResponse: axiosResponse,
                dockerRequest: dockerRequest,
                dockerAPIVersion: "v1.41",
                resolution: responseContext => responseHolder.result = responseContext
            } as RequestContext<any>;
        }
    });
});

class ResponseObjectMock {

    private readonly handlers: Map<string, (input: string) => void>;

    constructor() {
        this.handlers = new Map<string, any>();
    }

    on(event: string, handler: (input: string) => void) {
        this.handlers.set(event, handler);
        return this;
    }

    getHandler(event: string): ((input: string) => void) | undefined {
        return this.handlers.get(event);
    }
}
