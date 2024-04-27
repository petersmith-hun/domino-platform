import { storageUtility, StorageUtility } from "@bin-exec-agent/utility/storage-utility";
import { Task, TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task";
import { createTaskResult } from "@core-lib/agent/service/utility";
import LoggerFactory from "@core-lib/platform/logging";

const taskName = "Storage attachment";

/**
 * Task implementation to handle attaching the deployment storage.
 */
export class StorageAttachmentTask implements Task {

    private readonly logger = LoggerFactory.getLogger(StorageAttachmentTask);

    private readonly storageUtility: StorageUtility;

    constructor(storageUtility: StorageUtility) {
        this.storageUtility = storageUtility;
    }

    /**
     * Triggers creating the base storage paths and ensures accessibility of those via StorageUtility. Returns DONE
     * status on success, FAILED otherwise.
     *
     * @param _context unused
     */
    run(_context: TaskContext): Promise<TaskResult> {

        return new Promise(resolve => {

            try {
                this.logger.info(`Attaching storage ...`);
                this.storageUtility.createStorage();
                this.storageUtility.ensureStorageAccess();
                this.logger.info("Storage successfully attached");
                resolve(createTaskResult(TaskStatus.DONE));

            } catch (error: any) {
                this.logger.error(`Failed to attach storage: ${error?.message}; terminating ...`);
                resolve(createTaskResult(TaskStatus.FAILED));
            }
        });
    }

    taskName(): string {
        return taskName;
    }
}

export const storageAttachmentTask = new StorageAttachmentTask(storageUtility);
