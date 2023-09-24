import { MessageProcessor } from "@coordinator/core/socket/message/index";
import { sendMessage } from "@coordinator/core/socket/utilities";
import { MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import { WebSocket } from "ws";

/**
 * MessageProcessor implementation for handling connection keep-alive (ping) messages.
 */
export class PingMessageProcessor implements MessageProcessor<undefined> {

    /**
     * Responds to the incoming connection keep-alive (ping) message via the connected socket instance.
     *
     * @param socket WebSocket instance opened by the agent (unused by this implementation)
     * @param message ping socket message received from the agent
     */
    process(socket: WebSocket, message: SocketMessage<undefined>): void {

        const pongMessage: SocketMessage<undefined> = {
            messageID: message.messageID,
            messageType: MessageType.PONG,
            payload: undefined
        };

        sendMessage(socket, pongMessage);
    }

    forMessageType(): MessageType | undefined {
        return MessageType.PING;
    }
}

export const pingMessageProcessor = new PingMessageProcessor();
