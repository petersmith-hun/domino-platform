import { HttpStatus } from "@core-lib/platform/api/common";
import LoggerFactory from "@core-lib/platform/logging";
import { RequestContext, ResponseContext, ResponseHandlerPolicy } from "@docker-agent/domain";

/**
 * Response handler logic for Docker Engine API calls.
 */
export class DockerResponseHandler {

	private readonly logger = LoggerFactory.getLogger(DockerResponseHandler);

	/**
	 * Handles response made via Axios to the Docker Engine API.
	 * Logic defines four handlers for the different states of responses:
	 *  - response: first response of the engine, containing generic information about the call results (e.g. status code)
	 *  - data: returned data chunk as JSON string (or multiple JSON strings separated by LF symbol)
	 *  - error: request failure (e.g. host unavailable)
	 *  - end: indicates closing the request
	 *
	 * 'Data' handling can happen in 3 ways (always expecting JSON):
	 *  - ResponseHandlerPolicy.SINGLE: handle a single line of response
	 *  - ResponseHandlerPolicy.LOG_ONLY_STREAM: handle multiple lines of response in a streaming manner, only logs them
	 *  - ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM: handle multiple lines of response in a streaming manner, logs and collects them in the response context
	 *
	 * The logic writes the collected response in a response context object, and returns the result on 'end' event by calling the passed
	 * Promise resolution method. In case of error, the same method is called with the response context and the error flag set to true.
	 *
	 * @param requestContext contains the necessary parameters for handling a response:
	 */
	readDockerResponse<T>(requestContext: RequestContext<T>): void {

		const responseHandlerPolicy = requestContext.dockerRequest.dockerCommand.responseHandlerPolicy;
		const responseContext: ResponseContext<T> = {
			error: false,
			streamingResult: responseHandlerPolicy.streamResponse,
			statusCode: requestContext.rawResponse.status,
			data: responseHandlerPolicy === ResponseHandlerPolicy.LOG_AND_COLLECT_STREAM
				? [] as T
				: undefined
		};

		if (responseContext.statusCode < HttpStatus.BAD_REQUEST) {
			this.logger.info(`Response received from Docker Engine for command=${requestContext.dockerRequest.dockerCommand.id} `
				+ `on deployment=${requestContext.dockerRequest.deploymentID}, statusCode=${responseContext.statusCode}`);
			this.processData(requestContext, responseContext);
		} else {
			this.errorHandler(requestContext, responseContext);
		}
	}

	private processData<T>(requestContext: RequestContext<T>, responseContext: ResponseContext<T>) {

		if (responseContext.streamingResult) {
			requestContext.rawResponse.data
				.on("data", (line: Uint8Array) => this.parseDataLine(line)
					.forEach((item) => this.processDataItem(requestContext, responseContext, item as T)))
				.on("end", () => this.endHandler(requestContext, responseContext));
		} else {
			this.processDataItem(requestContext, responseContext, requestContext.rawResponse.data);
			this.endHandler(requestContext, responseContext);
		}
	}

	private parseDataLine<T>(line: Uint8Array): T[] {

		return Buffer.from(line)
			.toString("utf8")
			.trim()
			.split("\n")
			.map((item) => {
				try {
					return JSON.parse(item);
				} catch (error: any) {
					this.logger.error(`Failed to parse item=${item} as JSON object - ${error?.message}`);
				}
			});
	}

	private processDataItem<T>(requestContext: RequestContext<T>, responseContext: ResponseContext<T>, item: T): void {

		const dockerRequest = requestContext.dockerRequest;
		const responseHandlerPolicy = dockerRequest.dockerCommand.responseHandlerPolicy;

		this.logger.info(`Docker ${requestContext.dockerAPIVersion} | ${dockerRequest.deploymentID} | ${JSON.stringify(item)}`);

		if (responseHandlerPolicy.collectResponse) {
			if (responseHandlerPolicy.streamResponse) {
				(responseContext.data as T[]).push(item);
			} else {
				responseContext.data = item;
			}
		}
	}

	private errorHandler<T>(requestContext: RequestContext<T>, responseContext: ResponseContext<T>) {

		const dockerRequest = requestContext.dockerRequest;
		const rawResponse = requestContext.rawResponse;

		const message = typeof rawResponse.data === "string" ? rawResponse.data : rawResponse.statusText;
		this.logger.error(`Failed to execute Docker command=${dockerRequest.dockerCommand.id} for `
			+ `deployment=${dockerRequest.deploymentID} - ${rawResponse.status} | ${message}`);
		responseContext.error = true;
		responseContext.data = rawResponse.data;
		requestContext.resolution(responseContext);
	}

	private endHandler<T>(requestContext: RequestContext<T>, responseContext: ResponseContext<T>) {

		const dockerRequest = requestContext.dockerRequest;

		this.logger.info(`Finished executing Docker command=${dockerRequest.dockerCommand.id} for deployment=${dockerRequest.deploymentID}`);
		requestContext.resolution(responseContext);
	}
}

export const dockerResponseHandler = new DockerResponseHandler();
