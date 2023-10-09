import { agentCommonConfigModule } from "@core-lib/agent/config/agent-common-config-module";
import { AgentRunnerService } from "@core-lib/agent/service/agent-runner-service";
import { ConfirmationMessageHandler } from "@core-lib/agent/service/message/confirmation-message-handler";
import { KeepAliveMessageHandler } from "@core-lib/agent/service/message/keep-alive-message-handler";
import { LifecycleMessageHandler } from "@core-lib/agent/service/message/lifecycle-message-handler";
import { Task } from "@core-lib/agent/service/task";
import { AnnouncementTask } from "@core-lib/agent/service/task/announcement-task";
import { AuthenticationTask } from "@core-lib/agent/service/task/authentication-task";
import { CommandListenerLoopTask } from "@core-lib/agent/service/task/command-listener-loop-task";
import { KeepAliveTask } from "@core-lib/agent/service/task/keep-alive-task";
import { SocketConnectionTask } from "@core-lib/agent/service/task/socket-connection-task";
import { LifecycleOperation } from "@core-lib/platform/api/lifecycle/lifecycle-operation";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Builder implementation for conveniently spinning up an extensible agent. This should be used by the actual agent
 * implementations to pass the concrete LifecycleOperation implementation and start the agent.
 */
export class AgentBuilder {

    private readonly logger = LoggerFactory.getLogger(AgentBuilder);

    private readonly additionalTasks: Task[];
    private readonly lifecycleOperation: LifecycleOperation;

    private constructor(lifecycleOperation: LifecycleOperation) {
        this.lifecycleOperation = lifecycleOperation;
        this.additionalTasks = [];
    }

    /**
     * Instantiates the components of the agent and starts its execution by calling the AgentRunnerService#startAgent
     * method.
     */
    public run(): void {

        const service = new AgentRunnerService(agentCommonConfigModule, [
            new AuthenticationTask(),
            new SocketConnectionTask(),
            new AnnouncementTask(),
            new CommandListenerLoopTask([
                new ConfirmationMessageHandler(),
                new LifecycleMessageHandler(this.lifecycleOperation),
                new KeepAliveMessageHandler()
            ]),
            new KeepAliveTask(),
            ... this.additionalTasks
        ]);

        service.startAgent()
            .then(_ => this.logger.info("Agent started"));
    }

    /**
     * Registers an (optional) additional task. The specified task will be executed after all base tasks. More than one
     * task can be added using this method, execution order of the additional tasks is the same as how they were added
     * using this method.
     *
     * @param additionalTask Task implementation to be executed after the others
     */
    public additionalTask(additionalTask: Task): AgentBuilder {
        this.additionalTasks.push(additionalTask);
        return this;
    }

    /**
     * Registers the concrete LifecycleOperation implementation.
     *
     * @param lifecycleOperation LifecycleOperation implementation to be used by the agent
     */
    public static lifecycleOperation(lifecycleOperation: LifecycleOperation): AgentBuilder {
        return new AgentBuilder(lifecycleOperation);
    }
}
