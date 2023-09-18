import { SourceType } from "@core-lib/platform/api/deployment";
import { ConfigurationModule, MapNode } from "@core-lib/platform/config";
import LoggerFactory from "@core-lib/platform/logging";
import ms from "ms";

type AgentConfigNodeKey = "coordinator" | "identification";
type CoordinatorConfigKey = "host" | "api-key" | "ping-interval" | "pong-timeout";
type IdentificationConfigKey = "agent-key" | "host-id" | "type";
type AgentConfigKey = AgentConfigNodeKey | CoordinatorConfigKey | IdentificationConfigKey;

/**
 * Domino Coordinator connection parameters.
 */
export interface CoordinatorConfig {

    host: string;
    apiKey: string;
    pingInterval: number;
    pongTimeout: number;
}

/**
 * Agent identification parameters.
 */
export interface IdentificationConfig {

    agentKey: string;
    hostID: string;
    type: SourceType;
}

/**
 * Agent configuration root.
 */
export interface AgentConfig {

    coordinator: CoordinatorConfig;
    identification: IdentificationConfig;
}

/**
 * ConfigurationModule implementation for initializing the agent configuration.
 */
export class AgentCommonConfigModule extends ConfigurationModule<AgentConfig, AgentConfigKey> {

    private _compactID!: string;

    constructor() {
        super("agent", mapNode => {
            return {
                coordinator: this.mapCoordinatorConfig(mapNode),
                identification: this.mapIdentificationConfig(mapNode)
            }
        }, LoggerFactory.getLogger(AgentCommonConfigModule));

        super.init();
        this.logger?.info(`Configured agent ${this.compactID}`);
    }

    /**
     * Returns the agent's compact ID based on the configured identification parameters.
     * The compact ID's format is as follows: domino-agent://<hostID>/<type>/<agentKey>.
     */
    get compactID(): string {

        if (!this._compactID) {
            const id = this.getConfiguration().identification;
            this._compactID = `domino-agent://${id.hostID}/${id.type}/${id.agentKey}`
        }

        return this._compactID;
    }

    private mapCoordinatorConfig(agent: MapNode): CoordinatorConfig {

        const coordinator = super.getNode(agent, "coordinator");

        return {
            host: super.getValue(coordinator, "host"),
            apiKey: super.getValue(coordinator, "api-key"),
            pingInterval: ms(super.getValue(coordinator, "ping-interval") as string),
            pongTimeout: ms(super.getValue(coordinator, "pong-timeout") as string)
        }
    }

    private mapIdentificationConfig(agent: MapNode): IdentificationConfig {

        const identification = super.getNode(agent, "identification");

        return {
            agentKey: super.getValue(identification, "agent-key"),
            hostID: super.getValue(identification, "host-id"),
            type: SourceType[super.getValue(identification, "type") as keyof typeof SourceType]
        }
    }
}

export const agentCommonConfigModule = new AgentCommonConfigModule();
