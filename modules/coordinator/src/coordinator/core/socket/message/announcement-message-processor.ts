import { agentRegistry, AgentRegistry, AgentTrackingStatus } from "@coordinator/core/service/registry/agent-registry";
import { MessageProcessor } from "@coordinator/core/socket/message/index";
import { sendMessage } from "@coordinator/core/socket/utilities";
import { Announcement, Confirmation, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import { WebSocket } from "ws";

/**
 * MessageProcessor implementation for handling agent announcement messages.
 */
export class AnnouncementMessageProcessor implements MessageProcessor<Announcement> {

    private readonly agentRegistry: AgentRegistry;

    constructor(agentRegistry: AgentRegistry) {
        this.agentRegistry = agentRegistry;
    }

    /**
     * Requests tracking the agent, and on success, generates and sends a confirmation message to the agent. Otherwise,
     * terminates the socket connection of the unknown agent.
     *
     * @param socket WebSocket instance opened by the agent
     * @param message Announcement socket message received from the agent
     */
    process(socket: WebSocket, message: SocketMessage<Announcement>): void {

        const status = this.agentRegistry.trackAgent(message.payload as Announcement, socket);

        if (status === AgentTrackingStatus.REJECTED) {
            socket.terminate();
            return;
        }

        const agent = this.agentRegistry.identifyAgent(socket)!;
        const confirmationMessage: SocketMessage<Confirmation> = {
            messageID: `confirmation:${agent.agentID}`,
            messageType: MessageType.CONFIRMATION,
            payload: {
                message: `Agent accepted as [${agent.agentID}] with status [${status}]`
            }
        };

        sendMessage(socket, confirmationMessage);
    }

    forMessageType(): MessageType | undefined {
        return MessageType.ANNOUNCEMENT;
    }
}

export const announcementMessageProcessor = new AnnouncementMessageProcessor(agentRegistry);
