import {
    lifecycleCommandRegistry,
    LifecycleOperationRegistry
} from "@coordinator/core/socket/lifecycle-operation-registry";
import { MessageProcessor } from "@coordinator/core/socket/message/index";
import { OperationResult } from "@core-lib/platform/api/lifecycle";
import { MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import { WebSocket } from "ws";

/**
 * MessageProcessor implementation for handling lifecycle operation result messages.
 */
export class LifecycleResultMessageProcessor implements MessageProcessor<OperationResult> {

    private readonly lifecycleOperationRegistry: LifecycleOperationRegistry;

    constructor(lifecycleOperationRegistry: LifecycleOperationRegistry) {
        this.lifecycleOperationRegistry = lifecycleOperationRegistry;
    }

    /**
     * Requests marking any relevant lifecycle operations finished. Handling the actual outcome of the lifecycle operation
     * is out of the scope of this component.
     *
     * @param _socket WebSocket instance opened by the agent (unused by this implementation)
     * @param message OperationResult socket message received from the agent
     */
    process(_socket: WebSocket, message: SocketMessage<OperationResult>): void {
        this.lifecycleOperationRegistry.operationFinished(message.messageID, message.payload);
    }

    forMessageType(): MessageType | undefined {
        return MessageType.RESULT;
    }
}

export const lifecycleResultMessageProcessor = new LifecycleResultMessageProcessor(lifecycleCommandRegistry);
