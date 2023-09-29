import { Agent, agentConfigModule } from "@coordinator/core/config/agent-config-module";
import { Deployment } from "@core-lib/platform/api/deployment";
import { Announcement } from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";
import { WebSocket } from "ws";

/**
 * Agent with its connected socket instance.
 */
export interface ConnectedAgent extends Agent {

    socket: WebSocket;
}

/**
 * Possible agent tracking statuses.
 */
export enum AgentTrackingStatus {

    /**
     * Agent is accepted and tracked.
     */
    TRACKED = "TRACKED",

    /**
     * Agent has already announced itself earlier, probably reconnecting.
     */
    RECONNECTING = "RECONNECTING",

    /**
     * Unknown agent, rejected.
     */
    REJECTED = "REJECTED"
}

/**
 * Stores a socket instance along with its meta information.
 */
export interface SocketWrapper {

    socket: WebSocket;
    connected: boolean;
}

/**
 * Registry implementation to store and manage the known agents.
 */
export class AgentRegistry {

    private readonly logger = LoggerFactory.getLogger(AgentRegistry);

    private readonly knownAgents: Agent[];
    private readonly connectedAgents: Map<Agent, SocketWrapper> = new Map<Agent, SocketWrapper>();

    constructor(knownAgents: Agent[]) {
        this.knownAgents = knownAgents;
    }

    /**
     * Starts tracking the announced agent, if it's registered in the configuration as a known agent. Otherwise, rejects
     * the tracking request, basically not letting Domino Coordinator to contact the agent with lifecycle requests.
     *
     * @param announcement Announcement request coming from the agent
     * @param socket WebSocket instance opened by the agent
     */
    public trackAgent(announcement: Announcement, socket: WebSocket): AgentTrackingStatus {

        let trackingStatus: AgentTrackingStatus;
        const agent = this.getKnown(announcement);

        if (agent) {
            if (this.connectedAgents.has(agent)) {
                this.logger.warn(`Agent [${agent.agentID}] reconnected`);
                trackingStatus = AgentTrackingStatus.RECONNECTING;
            } else {
                this.logger.info(`Agent [${agent.agentID}] has been accepted, tracked`);
                trackingStatus = AgentTrackingStatus.TRACKED;
            }
            this.connectedAgents.set(agent, { socket, connected: true });
        } else {
            this.logger.error(`Unknown agent [${announcement.hostID} / ${announcement.type} / ${announcement.agentKey}] has been rejected`);
            trackingStatus = AgentTrackingStatus.REJECTED;
        }

        return trackingStatus;
    }

    /**
     * Identifies a tracked agent based on its connected socket instance. Returns undefined, if no tracked agent is
     * found for the given socket.
     *
     * @param socket WebSocket instance opened by the agent
     */
    public identifyAgent(socket: WebSocket): Agent | undefined {

        return Array.from(this.connectedAgents.entries())
            .filter(entry => entry[1].socket === socket)
            ?.map(entry => entry[0])
            .find(() => true);
    }

    /**
     * Marks a tracked agent disconnected by its original socket instance. Disconnected agents cannot be used for
     * executing lifecycle operations, but they are also expected to reconnect after some time, therefore they are not
     * removed from the registry.
     *
     * @param socket WebSocket instance opened by the agent
     */
    public markAgentDisconnected(socket: WebSocket): void {

        const agent = this.identifyAgent(socket);
        if (agent) {
            this.connectedAgents.set(agent, { socket, connected: false });
            this.logger.warn(`Agent [${agent.agentID}] marked as gone`);
        } else {
            this.logger.warn("Agent cannot be dropped as it is not tracked");
        }
    }

    /**
     * Returns the (first available) assigned agent for the given deployment. If more than one agent is assigned to the
     * deployment, returns the first matching one. This method should be deprecated, once support for multi-instance
     * deployments is implemented.
     *
     * @param deployment Deployment configuration containing the name and type of the assigned agent
     */
    public getFirstAvailable(deployment: Deployment): ConnectedAgent {

        const agent = Array.from(this.connectedAgents.keys())
            .find(agent => deployment.target.hosts.includes(agent.hostID)
                && agent.type === deployment.source.type);

        if (!(agent && this.connectedAgents.get(agent)?.connected)) {
            throw new Error("No eligible agent has connected yet");
        }

        return {
            ...agent,
            socket: this.connectedAgents.get(agent)!.socket
        }
    }

    private getKnown(announcement: Announcement): Agent | undefined {

        return this.knownAgents
            .find(agent => agent.hostID === announcement.hostID
                && agent.type === announcement.type
                && agent.agentKey === announcement.agentKey);
    }
}

export const agentRegistry = new AgentRegistry(agentConfigModule.getConfiguration().knownAgents);
