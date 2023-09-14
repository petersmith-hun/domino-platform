import { MessageHandler } from "@core-lib/agent/service/message";
import { Task, TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task/index";
import { createTaskResult, sendMessage } from "@core-lib/agent/service/utility";
import {
    ConfirmationMessage,
    Failure,
    LifecycleMessage,
    MessageType,
    SocketMessage
} from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";
import { RawData } from "ws";

const taskName = "Command listener loop";

/**
 * Task implementation for handling incoming socket messages.
 */
export class CommandListenerLoopTask implements Task {

    private readonly logger = LoggerFactory.getLogger(CommandListenerLoopTask);

    private readonly messageHandlers: Map<MessageType, MessageHandler<any>>;

    constructor(messageHandlers: MessageHandler<any>[]) {
        this.messageHandlers = new Map(messageHandlers.map(handler => [handler.forMessageType(), handler]));
    }

    /**
     * Adds an on-message listener to the active socket, and runs the task payload virtually infinitely. The implementation
     * attaches the message event handler to the existing socket, then right away returns with "running" status. In the
     * background, the incoming messages are being listened to until the Coordinator closes the socket connection.
     * Message processing is delegated to the respective MessageHandler implementations. Errors are gracefully handled.
     * Returns with running status after attaching the listener.
     *
     * @param context TaskContext object containing the necessary pieces of information for any implemented task
     */
    run(context: TaskContext): Promise<TaskResult> {

        context.socket?.on("message", async data => {

            const message = this.parseData(data);
            if (message) {
                this.processWithLoggingContext(context, message);
            }
        });

        return Promise.resolve(createTaskResult(TaskStatus.RUNNING));
    }

    taskName(): string {
        return taskName;
    }

    private parseData(data: RawData): ConfirmationMessage | LifecycleMessage | undefined {

        try {
            const content = JSON.parse(data.toString());
            return content as ConfirmationMessage | LifecycleMessage;
        } catch (error: any) {

            this.logger.error(`Failed to parse received data: ${error?.message}`);
            return undefined;
        }
    }

    private processWithLoggingContext(context: TaskContext, message: SocketMessage<any>): void {

        LoggerFactory.asyncLocalStorage.run({ requestId: message?.messageID ?? "invalid-message" }, () => {
            try {
                this.messageHandlers.get(message.messageType)?.process(context, message);
            } catch (error: any) {
                this.handleError(error, message, context);
            }
        });
    }

    private handleError(error: any, message: SocketMessage<any>, context: TaskContext) {

        const failureMessage = `Unexpected error occurred while processing the message: ${error?.message}`;
        this.logger.error(failureMessage);

        const failureResponse: SocketMessage<Failure> = {
            messageID: message.messageID,
            messageType: MessageType.FAILURE,
            payload: {
                message: failureMessage
            }
        }

        sendMessage(context, failureResponse);
    }
}
