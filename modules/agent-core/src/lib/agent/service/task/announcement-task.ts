import { AgentStatus, Task, TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task/index";
import { createTaskResult, sendMessage } from "@core-lib/agent/service/utility";
import { Announcement, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";

const taskName = "Announce agent to Coordinator";

/**
 * Task implementation for agent announcement step.
 */
export class AnnouncementTask implements Task {

    private readonly logger = LoggerFactory.getLogger(AnnouncementTask);

    /**
     * Runs the task payload once. During this phase the agent sends its identifier to the Coordinator. On successfully
     * doing so, Coordinator registers the agent and sends back a confirmation, so the agent can start listening to
     * deployment requests. Returns with done status if the announcement is successfully sent, failed status otherwise.
     *
     * @param context TaskContext object containing the necessary pieces of information for any implemented task
     */
    run(context: TaskContext): Promise<TaskResult> {
        return new Promise(resolve => this.announce(context, resolve));
    }

    taskName(): string {
        return taskName;
    }

    private announce(context: TaskContext, resolve: (value: TaskResult) => void) {

        const announcement: SocketMessage<Announcement> = {
            messageID: `announce:${context.agentID}`,
            messageType: MessageType.ANNOUNCEMENT,
            payload: context.config.identification
        };

        sendMessage(context, announcement, error => {

            if (error) {
                this.logger.error(`Failed to submit announcement: ${error.message}`);
            } else {
                context.agentStatus = AgentStatus.ANNOUNCED;
            }

            resolve(createTaskResult(error
                ? TaskStatus.FAILED
                : TaskStatus.DONE));
        });
    }
}
