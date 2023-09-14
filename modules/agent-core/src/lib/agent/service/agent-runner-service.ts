import { AgentCommonConfigModule } from "@core-lib/agent/config/agent-common-config-module";
import { AgentStatus, Task, TaskContext, TaskStatus } from "@core-lib/agent/service/task";
import { fatal } from "@core-lib/platform/error";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Service implementation coordinating the execution of the registered tasks.
 */
export class AgentRunnerService {

    private readonly logger = LoggerFactory.getLogger(AgentRunnerService);

    private readonly agentCommonConfigModule: AgentCommonConfigModule;
    private readonly tasks: Task[];

    constructor(agentCommonConfigModule: AgentCommonConfigModule, tasks: Task[]) {
        this.agentCommonConfigModule = agentCommonConfigModule;
        this.tasks = tasks;
    }

    /**
     * Starts the agent by initializing the TaskContext object and executing each task in the given order. It awaits
     * the result of each task, and if any of those returns with failed status, signals a fatal error, causing the
     * agent to quit.
     */
    public async startAgent(): Promise<void> {

        const context: TaskContext = {
            config: this.agentCommonConfigModule.getConfiguration(),
            agentID: this.agentCommonConfigModule.compactID,
            agentStatus: AgentStatus.INITIALIZING
        }

        for (const task of this.tasks) {

            this.logger.info(`Starting task [${task.taskName()}] ...`);
            const taskResult = await task.run(context);
            this.logger.info(`Executed task [${task.taskName()}] with result [${taskResult.status}]`);

            if (taskResult.status === TaskStatus.FAILED) {
                fatal(new Error(`Failed to execute task [${task.taskName()}] - quitting`));
            }
        }
    }
}
