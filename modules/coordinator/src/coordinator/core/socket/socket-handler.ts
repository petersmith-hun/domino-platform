import { agentRegistry, AgentRegistry } from "@coordinator/core/service/registry/agent-registry";
import { delegatingMessageProcessor, MessageProcessor } from "@coordinator/core/socket/message";
import { SocketMessage } from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";
import { WebSocket } from "ws";

/**
 * Basic socket operations handler.
 */
export class SocketHandler {

    private readonly logger = LoggerFactory.getLogger(SocketHandler);

    private readonly messageProcessor: MessageProcessor<any>;
    private readonly agentRegistry: AgentRegistry;

    constructor(messageProcessor: MessageProcessor<any>, agentRegistry: AgentRegistry) {
        this.messageProcessor = messageProcessor;
        this.agentRegistry = agentRegistry;
    }

    /**
     * Attaches the necessary listeners to the given WebSocket instance. These are the following:
     *  - message: passes any incoming message to the DelegatingMessageProcessor;
     *  - close: handling shutting down the socket connection with the agent gracefully, by marking the agent disconnected;
     *  - error: generic socket error handler, currently only logging any error.
     *
     * @param socket WebSocket instance opened by the agent
     */
    public attachListener(socket: WebSocket): void {

        socket.on("message", data => {

            this.logger.debug(`Message received from agent [${this.identify(socket)}]`);

            const message = JSON.parse(data.toString()) as SocketMessage<any>;
            this.messageProcessor.process(socket, message);
        });

        socket.on("close", () => {

            this.logger.warn(`Agent [${this.identify(socket)}] closed socket connection`);
            this.agentRegistry.markAgentDisconnected(socket);
        });

        socket.on("error", error => {
            this.logger.error(`Socket error occurred with agent [${this.identify(socket)}]: ${error.message}`);
        });
    }

    private identify(socket: WebSocket): string {
        return this.agentRegistry.identifyAgent(socket)?.agentID ?? "unknown";
    }
}

export const socketHandler = new SocketHandler(delegatingMessageProcessor, agentRegistry);
