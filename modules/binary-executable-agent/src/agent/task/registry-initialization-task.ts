import { Registry } from "@bin-exec-agent/registry";
import { executorUserRegistry } from "@bin-exec-agent/registry/executor-user-registry";
import { runtimeRegistry } from "@bin-exec-agent/registry/runtime-registry";
import { serviceAdapterRegistry } from "@bin-exec-agent/registry/service-adapter-registry";
import { Task, TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task";
import { createTaskResult } from "@core-lib/agent/service/utility";
import LoggerFactory from "@core-lib/platform/logging";

const taskName = "Registry initialization";

/**
 * Task implementation to initialize registries.
 */
export class RegistryInitializationTask implements Task {

    private readonly logger = LoggerFactory.getLogger(RegistryInitializationTask);

    private readonly registries: Registry[];

    constructor(registries: Registry[]) {
        this.registries = registries;
    }

    /**
     * Runs initialization of the collected registries. If any of the registries throw an error upon initialization,
     * returns FAILED status, DONE otherwise.
     *
     * @param _context unused
     */
    run(_context: TaskContext): Promise<TaskResult> {

        return new Promise<TaskResult>(resolve => {

            try {
                this.registries.forEach(registry => registry.initialize());
                resolve(createTaskResult(TaskStatus.DONE));

            } catch (error: any) {
                this.logger.error(`Registry initialization failed: ${error?.message}`);
                resolve(createTaskResult(TaskStatus.FAILED));
            }
        });
    }

    taskName(): string {
        return taskName;
    }
}

export const registryInitializationTask = new RegistryInitializationTask([
    executorUserRegistry,
    runtimeRegistry,
    serviceAdapterRegistry
]);
