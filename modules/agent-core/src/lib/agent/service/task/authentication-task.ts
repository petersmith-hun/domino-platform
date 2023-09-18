import { Task, TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task";
import { createTaskResult } from "@core-lib/agent/service/utility";

const taskName = "Authenticate agent";

/**
 * Task implementation for agent authentication step.
 */
export class AuthenticationTask implements Task {

    /**
     * Runs the task payload once. The current implementation simply adds the defined API Key and agent ID as an
     * X-Api-Key and X-Agent-ID header entry respectively. Always returns with done status.
     *
     * @param context TaskContext object containing the necessary pieces of information for any implemented task
     */
    run(context: TaskContext): Promise<TaskResult> {

        context.authorization = new Map<string, string>([
            ["X-Api-Key", context.config.coordinator.apiKey],
            ["X-Agent-ID", context.agentID]
        ]);

        return Promise.resolve(createTaskResult(TaskStatus.DONE));
    }

    taskName(): string {
        return taskName;
    }
}
