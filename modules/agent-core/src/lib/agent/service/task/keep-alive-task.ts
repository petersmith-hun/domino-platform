import { Task, TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task";
import { createTaskResult, sendMessage } from "@core-lib/agent/service/utility";
import { MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import { fatal } from "@core-lib/platform/error";
import LoggerFactory from "@core-lib/platform/logging";
import { hrtime } from "process";

const taskName = "Schedule keep-alive message";
const failedPingMessage = "Last ping attempt was not confirmed by Coordinator";

/**
 * Task implementation for keeping the websocket connection alive.
 */
export class KeepAliveTask implements Task {

    private readonly logger = LoggerFactory.getLogger(KeepAliveTask);

    /**
     * Schedules the task payload execution based on the configuration. It sends a ping message to the Coordinator
     * every once in a while and expects a response to it in a timely manner. If ping confirmation does not arrive in
     * time, requests terminating the agent instance to enforce a reconnection. Returns with scheduled status, and the
     * payload is executed every once in the defined interval (domino.agent.coordinator.ping-interval), expecting a
     * confirmation in domino.agent.coordinator.pong-timeout amount of time.
     *
     * @param context TaskContext object containing the necessary pieces of information for any implemented task
     */
    run(context: TaskContext): Promise<TaskResult> {

        context.keepAliveInterval = setInterval(
            () => this.ping(context),
            context.config.coordinator.pingInterval);

        return Promise.resolve(createTaskResult(TaskStatus.SCHEDULED));
    }

    taskName(): string {
        return taskName;
    }

    private ping(context: TaskContext): void {

        this.logger.debug("Pinging Coordinator to keep connection alive ...");
        context.pingConfirmed = false;

        const pingMessage: SocketMessage<undefined> = {
            messageID: `ping:${hrtime.bigint()}`,
            messageType: MessageType.PING,
            payload: undefined
        };

        sendMessage(context, pingMessage, () => {
            setTimeout(
                () => this.verifySuccessfulPing(context),
                context.config.coordinator.pongTimeout);
        });
    }

    private verifySuccessfulPing(context: TaskContext): void {

        if (!context.pingConfirmed) {
            this.logger.warn(failedPingMessage);
            fatal(new Error(failedPingMessage), this.logger);
        }
    }
}
