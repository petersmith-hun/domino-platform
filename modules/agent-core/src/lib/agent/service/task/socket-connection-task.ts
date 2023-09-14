import { Task, TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task/index";
import { createTaskResult } from "@core-lib/agent/service/utility";
import LoggerFactory from "@core-lib/platform/logging";
import { WebSocket } from "ws";

const taskName = "Establishing socket connection";

/**
 * Task implementation for handling the socket connection phase.
 */
export class SocketConnectionTask implements Task {

    private readonly logger = LoggerFactory.getLogger(SocketConnectionTask);

    /**
     * Runs the task payload once. This task creates and registers the socket in the context, then attaches the open,
     * close and error event handlers. On successfully establishing connection it returns with done status, failed otherwise.
     *
     * @param context TaskContext object containing the necessary pieces of information for any implemented task
     */
    run(context: TaskContext): Promise<TaskResult> {

        return new Promise(resolve => {
            this.createSocket(context);
            this.attachErrorHandler(context, resolve);
            this.attachCloseListener(context);
            this.openConnection(context, resolve);
        });
    }

    taskName(): string {
        return taskName;
    }

    private createSocket(context: TaskContext) {

        context.socket = new WebSocket(context.config.coordinator.host, {
            headers: Object.fromEntries(context.authorization!)
        });
    }

    private attachErrorHandler(context: TaskContext, resolve: (value: TaskResult) => void): void {

        context.socket?.on("error", err => {
            this.logger.error(`Socket error when reaching out to Coordinator on ${context.config.coordinator.host}: ${err.message}`);
            resolve(createTaskResult(TaskStatus.FAILED));
        })
    }

    private openConnection(context: TaskContext, resolve: (value: TaskResult) => void): void {

        context.socket?.on("open", () => {
            this.logger.info(`Coordinator on ${context.config.coordinator.host} responded to the handshake -- trying to announce self ...`);
            resolve(createTaskResult(TaskStatus.DONE));
        });
    }

    private attachCloseListener(context: TaskContext): void {

        context.socket?.on("close", () => {
            this.logger.warn(`Coordinator on ${context.config.coordinator.host} closed connection -- enforcing agent restart`);
        });
    }
}
