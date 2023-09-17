import { MessageHandler } from "@core-lib/agent/service/message";
import { AgentStatus, TaskContext } from "@core-lib/agent/service/task";
import { Confirmation, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * MessageHandler implementation for agent announcement confirmation messages.
 */
export class ConfirmationMessageHandler implements MessageHandler<Confirmation> {

    private readonly logger = LoggerFactory.getLogger(ConfirmationMessageHandler);

    /**
     * Processes the confirmation message by executing the following steps:
     *  - Logs the fact of the confirmation;
     *  - Sets the agent status on the TaskContext to "listening".
     * By the point of receiving the confirmation message, the agent is officially listening to incoming deployment commands.
     *
     * @param context TaskContext object containing the agent's global configuration, as well as the active socket object
     * @param message Confirmation object wrapped in SocketMessage
     */
    process(context: TaskContext, message: SocketMessage<Confirmation>): void {

        context.agentStatus = AgentStatus.LISTENING;
        this.logger.info(`Agent confirmed by Coordinator: ${message.payload.message}`);
    }

    forMessageType(): MessageType {
        return MessageType.CONFIRMATION;
    }
}
