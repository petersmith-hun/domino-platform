import { TaskContext } from "@core-lib/agent/service/task";
import { MessageType, SocketMessage } from "@core-lib/platform/api/socket";

/**
 * MessageHandler implementation must deal with the different kinds of incoming messages (sent by the Coordinator).
 * The implementations should react to these messages either by modifying the context, calling external handlers,
 * logging received information, respond to the messages if necessary, etc.
 *
 * Since the agents by nature work in an asynchronous manner, all message handler implementation must adhere that.
 * @param T type of the handled message
 */
export interface MessageHandler<T> {

    /**
     * Executes the messages processing logic.
     *
     * @param context TaskContext object containing the agent's global configuration, as well as the active socket object
     * @param message T message object wrapped in SocketMessage
     */
    process(context: TaskContext, message: SocketMessage<T>): void;

    /**
     * Returns the message type this implementation handles.
     */
    forMessageType(): MessageType;
}
