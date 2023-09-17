import { MessageHandler } from "@core-lib/agent/service/message";
import { TaskContext } from "@core-lib/agent/service/task";
import { MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * MessageHandler implementation for handling keep-alive response messages. "Pong" messages are simply noted
 */
export class KeepAliveMessageHandler implements MessageHandler<never> {

    private readonly logger = LoggerFactory.getLogger(KeepAliveMessageHandler);

    process(context: TaskContext, message: SocketMessage<undefined>): void {

        this.logger.debug(`Ping message [${message.messageID}] has been confirmed`);
        context.pingConfirmed = true;
    }

    forMessageType(): MessageType {
        return MessageType.PONG;
    }
}
