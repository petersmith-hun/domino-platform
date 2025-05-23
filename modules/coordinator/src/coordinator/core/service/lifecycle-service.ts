import { secretDAO, SecretDAO } from "@coordinator/core/dao/secret-dao";
import { agentRegistry, AgentRegistry } from "@coordinator/core/service/registry/agent-registry";
import {
    lifecycleOperationRegistry,
    LifecycleOperationRegistry
} from "@coordinator/core/socket/lifecycle-operation-registry";
import { sendMessage } from "@coordinator/core/socket/utilities";
import { Deployment } from "@core-lib/platform/api/deployment";
import { DeploymentVersion, OperationResult } from "@core-lib/platform/api/lifecycle";
import { LifecycleOperation } from "@core-lib/platform/api/lifecycle/lifecycle-operation";
import { Lifecycle, LifecycleCommand, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import { hrtime } from "node:process";

/**
 * LifecycleOperation implementation that is an integration layer with the agent coordinator. Each lifecycle method
 * tries resolving the relevant agent by the deployment configuration, then executes the lifecycle command by submitting
 * a lifecycle request to the specific agent. Finally, each method awaits for the agent's response and returns it.
 */
export class LifecycleService implements LifecycleOperation {

    private readonly agentRegistry: AgentRegistry;
    private readonly lifecycleOperationRegistry: LifecycleOperationRegistry;
    private readonly secretDAO: SecretDAO;

    constructor(agentRegistry: AgentRegistry, lifecycleOperationRegistry: LifecycleOperationRegistry, secretDAO: SecretDAO) {
        this.agentRegistry = agentRegistry;
        this.lifecycleOperationRegistry = lifecycleOperationRegistry;
        this.secretDAO = secretDAO;
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
        const secrets = await this.secretDAO.findAll();
        sendMessage(agent.socket, message, secrets);

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

export const lifecycleService = new LifecycleService(agentRegistry, lifecycleOperationRegistry, secretDAO);
