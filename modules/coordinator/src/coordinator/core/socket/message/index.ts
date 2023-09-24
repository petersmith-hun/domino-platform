import { announcementMessageProcessor } from "@coordinator/core/socket/message/announcement-message-processor";
import { failureMessageProcessor } from "@coordinator/core/socket/message/failure-message-processor";
import { lifecycleResultMessageProcessor } from "@coordinator/core/socket/message/lifecycle-result-message-processor";
import { pingMessageProcessor } from "@coordinator/core/socket/message/ping-message-processor";
import { MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";
import { WebSocket } from "ws";

/**
 * Implementations of this interface must handle the different kinds of incoming socket messages, including responding
 * to a given message.
 *
 * @param T type of the handled message
 */
export interface MessageProcessor<T> {

    /**
     * Processes the given message type. Caller should pass the connected socket instance as well, in case the
     * implementation needs to react the message by submitting a response.
     *
     * @param socket WebSocket instance opened by the agent
     * @param message socket message received from the agent
     */
    process(socket: WebSocket, message: SocketMessage<T>): void;

    /**
     * Group of the handled messages as MessageType enum constant. May return undefined, if the implementation is not
     * directly attached to a specific message type (e.g. a routing message processor implementation).
     */
    forMessageType(): MessageType | undefined;
}

/**
 * Default implementation of the MessageProcessor interface, delegating the message to be processed to the right processor.
 */
export class DelegatingMessageProcessor implements MessageProcessor<any> {

    private readonly logger = LoggerFactory.getLogger(DelegatingMessageProcessor);

    private readonly messageProcessorMap: Map<MessageType, MessageProcessor<any>>;

    constructor(messageProcessors: MessageProcessor<any>[]) {
        this.messageProcessorMap = new Map(messageProcessors.map(messageProcessor => [messageProcessor.forMessageType()!, messageProcessor]));
    }

    /**
     * Selects the proper message processor implementation based on the type of the received socket message.
     *
     * @param socket WebSocket instance opened by the agent
     * @param message socket message received from the agent
     */
    process(socket: WebSocket, message: SocketMessage<any>): void {

        this.logger.debug(`Processing message [${message.messageID}] of type [${message.messageType}]`);

        const processor = this.messageProcessorMap.get(message.messageType);
        if (processor) {
            processor.process(socket, message);
        } else {
            this.logger.warn(`No registered message processor found for message type [${message.messageType}]`);
        }
    }

    forMessageType(): MessageType | undefined {
        return undefined;
    }
}

export const delegatingMessageProcessor = new DelegatingMessageProcessor([
    announcementMessageProcessor,
    pingMessageProcessor,
    lifecycleResultMessageProcessor,
    failureMessageProcessor
]);
