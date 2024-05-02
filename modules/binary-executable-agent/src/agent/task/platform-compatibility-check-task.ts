import { Task, TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task";
import { createTaskResult } from "@core-lib/agent/service/utility";
import LoggerFactory from "@core-lib/platform/logging";
import * as process from "node:process";

const taskName = "Platform compatibility check";
const compatiblePlatform: NodeJS.Platform = "linux";

/**
 * Task implementation checking the OS compatibility.
 * Note: this agent implementation support only Linux operating systems!
 */
export class PlatformCompatibilityCheckTask implements Task {

    private readonly logger = LoggerFactory.getLogger(PlatformCompatibilityCheckTask);
    private readonly currentPlatform: NodeJS.Platform;

    constructor(currentPlatform: NodeJS.Platform) {
        this.currentPlatform = currentPlatform;
    }

    /**
     * Runs OS compatibility verification. Returns DONE status on success, FAILED status otherwise.
     *
     * @param _context unused
     */
    run(_context: TaskContext): Promise<TaskResult> {

        return new Promise(resolve => {

            this.logger.info("Verifying compatible platform ...");

            if (this.isPlatformCompatible(this.currentPlatform)) {
                this.logger.info(`Agent is running on compatible platform: ${this.currentPlatform}`);
                resolve(createTaskResult(TaskStatus.DONE));
            } else {
                this.logger.error(`Agent is running on unsupported platform: ${this.currentPlatform}; terminating ...`);
                resolve(createTaskResult(TaskStatus.FAILED));
            }
        });
    }

    taskName(): string {
        return taskName;
    }

    private isPlatformCompatible(currentPlatform: NodeJS.Platform): boolean {
        return currentPlatform === compatiblePlatform;
    }
}

export const platformCompatibilityCheckTask = new PlatformCompatibilityCheckTask(process.platform);
