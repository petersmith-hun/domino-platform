import { Deployment } from "@core-lib/platform/api/deployment";
import { AxiosResponse } from "axios";

const API_VERSION = "v1.41";

/**
 * Used Docker Engine API methods.
 */
export enum HttpMethod {
    GET = "GET",
    POST = "POST",
    DELETE = "DELETE"
}

/**
 * Docker Engine API request wrapper.
 */
export class DockerRequest {

    readonly dockerCommand: DockerCommand;
    readonly urlParameters: Map<string, string>;
    readonly deploymentID?: string;
    readonly imageHome?: string;
    private _requestBody?: any;

    constructor(dockerCommand: DockerCommand, deployment?: Deployment) {
        this.dockerCommand = dockerCommand;
        this.urlParameters = new Map<string, string>();
        this.deploymentID = deployment?.id || undefined;
        this.imageHome = deployment?.source.home || undefined;
    }

    /**
     * Adds a new URL parameter to the parameter map.
     * Multiple calls can be chained.
     *
     * @param key name of the URL parameter as specified in DockerCommand command descriptors.
     * @param value value of the parameter
     * @returns DockerRequest instance (fluent-like builder)
     */
    public addUrlParameter(key: string, value: string): DockerRequest {
        this.urlParameters.set(key, value);
        return this;
    }

    /**
     * Sets the request body.
     * Multiple calls can be chained.
     *
     * @param requestBody any object that should be passed as request body
     * @returns DockerRequest instance (fluent-like builder)
     */
    public setRequestBody(requestBody: any): DockerRequest {
        this._requestBody = requestBody;
        return this;
    }

    public get requestBody(): any {
        return this._requestBody;
    }
}

/**
 * Docker Engine API response handler policies that determine how the response data should be processed.
 */
export class ResponseHandlerPolicy {

    readonly streamResponse: boolean;
    readonly collectResponse: boolean;

    private constructor({ streamResponse, collectResponse }: {
        streamResponse: boolean,
        collectResponse: boolean
    }) {
        this.streamResponse = streamResponse;
        this.collectResponse = collectResponse;
    }

    /**
     * API returns a single line of data as JSON.
     * The response should be returned by the client.
     */
    public static readonly SINGLE = new ResponseHandlerPolicy({
        streamResponse: false,
        collectResponse: true
    });

    /**
     * API returns multiple lines of data as JSON in SSE stream.
     * The response can be dropped as no further processing is needed, but should be logged.
     */
    public static readonly LOG_ONLY_STREAM = new ResponseHandlerPolicy({
        streamResponse: true,
        collectResponse: false
    });

    /**
     * API returns multiple lines of data as JSON in SSE stream.
     * Further processing of the response is needed, lines should be collected and returned by the client.
     */
    public static readonly LOG_AND_COLLECT_STREAM = new ResponseHandlerPolicy({
        streamResponse: true,
        collectResponse: true
    });
}

/**
 * Docker Engine API command descriptors.
 * Each command must define the method and the path of the API endpoint to be called.
 * URL parameters should be specified between curly brackets.
 * Each command also must specify whether Docker Registry authentication is needed during the call and how the response should be handled.
 */
export class DockerCommand {

    readonly id!: string;
    readonly method!: HttpMethod;
    readonly path!: string;
    readonly authRequired!: boolean;
    readonly responseHandlerPolicy!: ResponseHandlerPolicy;
    readonly lifecycleCommand!: boolean;

    private constructor(opts: DockerCommand) {
        Object.assign(this, opts);
    }

    /**
     * Docker Engine identification request.
     */
    public static readonly IDENTIFY = new DockerCommand({
        id: "IDENTIFY",
        method: HttpMethod.GET,
        path: `/${API_VERSION}/version`,
        authRequired: false,
        responseHandlerPolicy: ResponseHandlerPolicy.SINGLE,
        lifecycleCommand: false
    });

    /**
     * Docker image pull request (from existing image in a Docker Registry).
     * Must specify image name and tag as URL parameter in DockerRequest.
     */
    public static readonly PULL = new DockerCommand({
        id: "PULL",
        method: HttpMethod.POST,
        path: `/${API_VERSION}/images/create?fromImage={image}&tag={tag}`,
        authRequired: true,
        responseHandlerPolicy: ResponseHandlerPolicy.LOG_ONLY_STREAM,
        lifecycleCommand: false
    });

    /**
     * Docker container creation request.
     * Must specify container name as URL parameter in DockerRequest.
     */
    public static readonly CREATE_CONTAINER = new DockerCommand({
        id: "CREATE_CONTAINER",
        method: HttpMethod.POST,
        path: `/${API_VERSION}/containers/create?name={name}`,
        authRequired: false,
        responseHandlerPolicy: ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM,
        lifecycleCommand: false
    });

    /**
     * Docker container start request.
     * Must specify container ID/name as URL parameter in DockerRequest.
     */
    public static readonly START = new DockerCommand({
        id: "START",
        method: HttpMethod.POST,
        path: `/${API_VERSION}/containers/{id}/start`,
        authRequired: false,
        responseHandlerPolicy: ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM,
        lifecycleCommand: true
    });

    /**
     * Docker container stop request.
     * Must specify container ID/name as URL parameter in DockerRequest.
     */
    public static readonly STOP = new DockerCommand({
        id: "STOP",
        method: HttpMethod.POST,
        path: `/${API_VERSION}/containers/{id}/stop`,
        authRequired: false,
        responseHandlerPolicy: ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM,
        lifecycleCommand: true
    });

    /**
     * Docker container restart request.
     * Must specify container ID/name as URL parameter in DockerRequest.
     */
    public static readonly RESTART = new DockerCommand({
        id: "RESTART",
        method: HttpMethod.POST,
        path: `/${API_VERSION}/containers/{id}/restart`,
        authRequired: false,
        responseHandlerPolicy: ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM,
        lifecycleCommand: true
    });

    /**
     * Docker container remove request.
     * Must specify container ID/name as URL parameter in DockerRequest.
     * Forced-stop manner is enforced so the call also stops the container before removing it.
     */
    public static readonly REMOVE = new DockerCommand({
        id: "REMOVE",
        method: HttpMethod.DELETE,
        path: `/${API_VERSION}/containers/{id}?force=true`,
        authRequired: false,
        responseHandlerPolicy: ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM,
        lifecycleCommand: true
    });
}

/**
 * Docker Engine API request context.
 */
export interface RequestContext<T> {

    rawResponse: AxiosResponse<any>;
    dockerRequest: DockerRequest;
    resolution: (responseContext: ResponseContext<T>) => void;
    dockerAPIVersion: string;
}

/**
 * Docker Engine API response context.
 */
export interface ResponseContext<T> {

    error: boolean;
    streamingResult: boolean;
    statusCode: number;
    data?: T;
}
