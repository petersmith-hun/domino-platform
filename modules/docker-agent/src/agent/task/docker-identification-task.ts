import { Task, TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task";
import { createTaskResult } from "@core-lib/agent/service/utility";
import LoggerFactory from "@core-lib/platform/logging";
import { DockerCommand, DockerRequest, ResponseContext } from "@docker-agent/domain";
import { DockerVersionResponse } from "@docker-agent/domain/response-types";
import {
    dockerEngineApiClient,
    DockerEngineApiClient
} from "@docker-agent/service/docker/client/docker-engine-api-client";

const taskName = "Docker identification";

/**
 * Task implementation for Docker Engine identification.
 */
export class DockerIdentificationTask implements Task {

    private readonly logger = LoggerFactory.getLogger(DockerIdentificationTask);

    private readonly dockerEngineApiClient: DockerEngineApiClient;

    constructor(dockerEngineApiClient: DockerEngineApiClient) {
        this.dockerEngineApiClient = dockerEngineApiClient;
    }

    /**
     * Calls Docker Engine's /version endpoint to determine the running Engine and compatible API version. On success,
     * passes the determined version to the engine API client, so it can store it (currently used for debugging purposes
     * only), also resolves the task with done status. Otherwise, resolves the task with failed status.
     *
     * @param _context unused
     */
    run(_context: TaskContext): Promise<TaskResult> {

        return new Promise(async resolve => {
            try {
                const dockerRequest = new DockerRequest(DockerCommand.IDENTIFY);
                const version: ResponseContext<DockerVersionResponse> = await this.dockerEngineApiClient.executeDockerCommand(dockerRequest);
                this.dockerEngineApiClient.identifiedDockerVersion = version.data!.Version!;
                this.logger.info(`[Docker Engine identification] Hello, Domino, Docker v${version.data!.Version} is running using API Version ${version.data?.ApiVersion}`);

                resolve(createTaskResult(TaskStatus.DONE));
            } catch (error: any) {
                this.logger.error(`Failed to identify Docker Engine: ${error?.message}`);
                resolve(createTaskResult(TaskStatus.FAILED));
            }
        });
    }

    taskName(): string {
        return taskName;
    }
}

export const dockerIdentificationTask = new DockerIdentificationTask(dockerEngineApiClient);
