import { MessageHandler } from "@core-lib/agent/service/message/index";
import { AgentStatus, TaskContext } from "@core-lib/agent/service/task";
import { sendMessage } from "@core-lib/agent/service/utility";
import { OperationResult } from "@core-lib/platform/api/lifecycle";
import { LifecycleOperation } from "@core-lib/platform/api/lifecycle/lifecycle-operation";
import { Failure, Lifecycle, LifecycleCommand, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";

const agentNotConfirmed = "Agent is not yet confirmed, ignoring lifecycle command";

/**
 * MessageHandler implementation for handling the incoming deployment commands.
 */
export class LifecycleMessageHandler implements MessageHandler<Lifecycle> {

    private readonly logger = LoggerFactory.getLogger(LifecycleMessageHandler);

    private readonly commandMapping: Map<LifecycleCommand, (lifecycle: Lifecycle) => Promise<OperationResult>>;

    constructor(lifecycleOperation: LifecycleOperation) {

        this.commandMapping = new Map([
            [LifecycleCommand.DEPLOY, lifecycle => lifecycleOperation.deploy(lifecycle.deployment, lifecycle.version!)],
            [LifecycleCommand.START, lifecycle => lifecycleOperation.start(lifecycle.deployment)],
            [LifecycleCommand.STOP, lifecycle => lifecycleOperation.stop(lifecycle.deployment)],
            [LifecycleCommand.RESTART, lifecycle => lifecycleOperation.restart(lifecycle.deployment)]
        ]);
    }

    /**
     * Processes the incoming deployment commands by executing the following steps:
     *  - Acquires the proper lifecycle handler (defined via the LifecycleOperation interface) based on the received command type;
     *  - Passes the received deployment configuration to the lifecycle handler;
     *  - After the operation completed, sends the result back to the Coordinator via the active socket.
     * The implementation expects the agent to be already confirmed by Coordinator.
     *
     * @param context TaskContext object containing the agent's global configuration, as well as the active socket object
     * @param message Lifecycle object wrapped in SocketMessage
     */
    process(context: TaskContext, message: SocketMessage<Lifecycle>): void {

        if (!this.isAgentConfirmed(context)) {
            return;
        }

        const lifecycleRequest = message.payload;
        this.logger.info(`Executing lifecycle operation [${lifecycleRequest.command}] for deployment [${lifecycleRequest.deployment.id}] ...`);

        const lifecycleHandler = this.commandMapping.get(lifecycleRequest.command)!;

        lifecycleHandler(lifecycleRequest)
            .then(operationResult => this.handleOperationResult(message, operationResult, context))
            .catch(reason => this.handleError(message, reason, context))
            .finally(() => this.logger.info(`Finished executing lifecycle operation [${lifecycleRequest.command}] for deployment [${lifecycleRequest.deployment.id}]`));
    }

    forMessageType(): MessageType {
        return MessageType.LIFECYCLE;
    }

    private isAgentConfirmed(context: TaskContext): boolean {

        let confirmed = true;
        if (context.agentStatus !== AgentStatus.LISTENING) {
            this.logger.warn(agentNotConfirmed);

            const response: SocketMessage<Failure> = {
                messageID: `failure:${context.agentID}`,
                messageType: MessageType.FAILURE,
                payload: {
                    message: agentNotConfirmed
                }
            }
            sendMessage(context, response);

            confirmed = false;
        }

        return confirmed;
    }

    private handleOperationResult(message: SocketMessage<Lifecycle>, operationResult: OperationResult, context: TaskContext) {

        const response: SocketMessage<OperationResult> = {
            messageID: message.messageID,
            messageType: MessageType.RESULT,
            payload: operationResult
        }

        sendMessage(context, response);
    }

    private handleError(message: SocketMessage<Lifecycle>, reason: Error, context: TaskContext) {

        this.logger.error(`An error occurred while executing lifecycle operation [${message.payload.command}] for deployment [${message.payload.deployment.id}]`);

        const failureResponse: SocketMessage<Failure> = {
            messageID: message.messageID,
            messageType: MessageType.FAILURE,
            payload: {
                message: `Failed to execute lifecycle operation: ${reason.message}`
            }
        }

        sendMessage(context, failureResponse);
    }
}
