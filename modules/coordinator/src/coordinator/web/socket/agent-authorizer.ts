import { AgentConfig, agentConfigModule } from "@coordinator/core/config/agent-config-module";
import LoggerFactory from "@core-lib/platform/logging";
import { IncomingMessage } from "http";
import { WebSocket } from "ws";
import bcrypt from "bcrypt";

/**
 * Authorization handler component for agent socket connections.
 */
export class AgentAuthorizer {

    private readonly logger = LoggerFactory.getLogger(AgentAuthorizer);

    private readonly apiKey: string;

    constructor(agentConfig: AgentConfig) {
        this.apiKey = agentConfig.apiKey;
    }

    /**
     * Tries authorizing the agent's connection request by verifying the API key sent by the agent. If the agent is not
     * using the expected API key (or at all), socket connection is immediately terminated.
     *
     * @param socket WebSocket instance opened by the agent
     * @param request IncomingMessage message containing the passed headers, to extract the expected authorization data
     */
    public authorize(socket: WebSocket, request: IncomingMessage): boolean {

        const authorization = request.headers["x-api-key"] as string;
        const agentName = (request.headers["x-agent-id"] ?? "unknown") as string;
        this.logger.warn(`Agent [${agentName}] is attempting connection. Awaiting announcement ...`);

        const authorized = bcrypt.compareSync(authorization, this.apiKey);

        if (!authorized) {
            this.logger.error(`Authorization failed for agent [${agentName}] -- terminating connection`);
            socket.terminate();
        }

        return authorized;
    }
}

export const agentAuthorizer = new AgentAuthorizer(agentConfigModule.getConfiguration());
