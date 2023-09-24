import { agentRegistry, AgentRegistry } from "@coordinator/core/service/registry/agent-registry";
import {
    lifecycleCommandRegistry,
    LifecycleOperationRegistry
} from "@coordinator/core/socket/lifecycle-operation-registry";
import { MessageProcessor } from "@coordinator/core/socket/message/index";
import { Failure, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";
import { WebSocket } from "ws";

/**
 * MessageProcessor implementation for handling failure messages.
 */
export class FailureMessageProcessor implements MessageProcessor<Failure> {

    private readonly logger = LoggerFactory.getLogger(FailureMessageProcessor);

    private readonly agentRegistry: AgentRegistry;
    private readonly lifecycleOperationRegistry: LifecycleOperationRegistry;

    constructor(agentRegistry: AgentRegistry, lifecycleOperationRegistry: LifecycleOperationRegistry) {
        this.agentRegistry = agentRegistry;
        this.lifecycleOperationRegistry = lifecycleOperationRegistry;
    }

    /**
     * Logs any incoming failure message. Also requests marking any relevant lifecycle operations failed.
     *
     * @param socket WebSocket instance opened by the agent
     * @param message Failure socket message received from the agent
     */
    process(socket: WebSocket, message: SocketMessage<Failure>): void {

        const agentID = this.agentRegistry.identifyAgent(socket)?.agentID;
        this.logger.error(`Failure message received from agent [${agentID}]: ${message.payload.message}`);

        this.lifecycleOperationRegistry.operationFailed(message.messageID, message.payload);
    }

    forMessageType(): MessageType | undefined {
        return MessageType.FAILURE;
    }
}

export const failureMessageProcessor = new FailureMessageProcessor(agentRegistry, lifecycleCommandRegistry);
