import { SourceType } from "@core-lib/platform/api/deployment";
import { ConfigurationModule, MapNode } from "@core-lib/platform/config";
import ms from "ms";

type AgentConfigKey = "operation-timeout" | "api-key" | "known-agents" | "agent-key" | "host-id" | "type";

/**
 * Agent registration parameters.
 */
export class Agent {

    readonly agentKey: string;
    readonly hostID: string;
    readonly type: SourceType;
    readonly agentID: string;

    constructor(agentKey: string, hostID: string, type: SourceType) {
        this.agentKey = agentKey;
        this.hostID = hostID;
        this.type = type;
        this.agentID = `domino-agent://${this.hostID}/${this.type}/${this.agentKey}`;
    }
}

/**
 * Agent configuration root parameters.
 */
export interface AgentConfig {

    operationTimeout: number;
    apiKey: string;
    knownAgents: Agent[];
}

/**
 * ConfigurationModule implementation for accessing the data of the registered agents, as well as tracking the connected agents.
 */
export class AgentConfigModule extends ConfigurationModule<AgentConfig, AgentConfigKey> {

    constructor() {
        super("agent", mapNode => {

            return {
                operationTimeout: ms(super.getValue(mapNode, "operation-timeout") as string),
                apiKey: super.getValue(mapNode, "api-key"),
                knownAgents: this.mapKnownAgents(mapNode)
            };
        });

        super.init();
    }

    private mapKnownAgents(agent: MapNode): Agent[] {

        const knownAgents = super.getNode(agent, "known-agents");

        return (knownAgents as unknown as Array<any>)
            .map(agent => {
                return new Agent(
                    super.getValueFromObject(agent, "agent-key"),
                    super.getValueFromObject(agent, "host-id"),
                    SourceType[super.getValueFromObject(agent, "type") as keyof typeof SourceType])
            });
    }
}

export const agentConfigModule = new AgentConfigModule();
