import { MessageHandler } from "@core-lib/agent/service/message";
import { TaskContext } from "@core-lib/agent/service/task";
import { MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * MessageHandler implementation for handling keep-alive response messages.
 */
export class KeepAliveMessageHandler implements MessageHandler<never> {

    private readonly logger = LoggerFactory.getLogger(KeepAliveMessageHandler);

    /**
     * Processes the incoming "pong" messages, which are the indicators of the connection with the Coordinator still
     * being alive. The pong messages are simply logged on debug level, but along with that, the pingConfirmed flag
     * is set to true in the TaskContext every time a message of such is received.
     *
     * @param context TaskContext object containing the agent's global configuration, as well as the active socket object
     * @param message Lifecycle object wrapped in SocketMessage
     */
    process(context: TaskContext, message: SocketMessage<undefined>): void {

        this.logger.debug(`Ping message [${message.messageID}] has been confirmed`);
        context.pingConfirmed = true;
    }

    forMessageType(): MessageType {
        return MessageType.PONG;
    }
}
