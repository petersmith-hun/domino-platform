import { agentRegistry, AgentRegistry } from "@coordinator/core/service/registry/agent-registry";
import {
    lifecycleCommandRegistry,
    LifecycleOperationRegistry
} from "@coordinator/core/socket/lifecycle-operation-registry";
import { sendMessage } from "@coordinator/core/socket/utilities";
import { Deployment } from "@core-lib/platform/api/deployment";
import { DeploymentVersion, OperationResult } from "@core-lib/platform/api/lifecycle";
import { LifecycleOperation } from "@core-lib/platform/api/lifecycle/lifecycle-operation";
import { Lifecycle, LifecycleCommand, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import { hrtime } from "node:process";

/**
 * Dummy implementation of the LifecycleOperation interface.
 * Final implementation will be an integration layer with the agent coordinator.
 */
export class LifecycleService implements LifecycleOperation {

    private readonly agentRegistry: AgentRegistry;
    private readonly lifecycleOperationRegistry: LifecycleOperationRegistry;

    constructor(agentRegistry: AgentRegistry, lifecycleOperationRegistry: LifecycleOperationRegistry) {
        this.agentRegistry = agentRegistry;
        this.lifecycleOperationRegistry = lifecycleOperationRegistry;
    }

    async deploy(deployment: Deployment, version: DeploymentVersion): Promise<OperationResult> {
        return this.submitLifecycleOperation(LifecycleCommand.DEPLOY, deployment, version);
    }

    async start(deployment: Deployment): Promise<OperationResult> {
        return this.submitLifecycleOperation(LifecycleCommand.START, deployment);
    }

    async stop(deployment: Deployment): Promise<OperationResult> {
        return this.submitLifecycleOperation(LifecycleCommand.STOP, deployment);
    }

    async restart(deployment: Deployment): Promise<OperationResult> {
        return this.submitLifecycleOperation(LifecycleCommand.RESTART, deployment);
    }

    private async submitLifecycleOperation(command: LifecycleCommand, deployment: Deployment, version?: DeploymentVersion): Promise<OperationResult> {

        const agent = this.agentRegistry.getFirstAvailable(deployment);
        const message: SocketMessage<Lifecycle> = this.createLifecycleMessage(command, deployment, version);
        sendMessage(agent.socket, message);

        return await this.lifecycleOperationRegistry.operationStarted(message.messageID);
    }

    private createLifecycleMessage(command: LifecycleCommand, deployment: Deployment, version?: DeploymentVersion): SocketMessage<Lifecycle> {

        return {
            messageID: this.createMessageID(command, deployment, version),
            messageType: MessageType.LIFECYCLE,
            payload: {
                deployment: deployment,
                version: version,
                command: command
            }
        };
    }

    private createMessageID(command: LifecycleCommand, deployment: Deployment, version?: DeploymentVersion): string {
        return `lifecycle/${command.toLowerCase()}/${deployment.id}/${version?.version ?? "current"}/${hrtime.bigint()}`;
    }
}

export const lifecycleService = new LifecycleService(agentRegistry, lifecycleCommandRegistry);
