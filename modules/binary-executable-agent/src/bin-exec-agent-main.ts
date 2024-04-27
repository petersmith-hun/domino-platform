import { binaryExecutionLifecycleOperation } from "@bin-exec-agent/service/binary-execution-lifecycle-operation";
import { platformCompatibilityCheckTask } from "@bin-exec-agent/task/platform-compatibility-check-task";
import { registryInitializationTask } from "@bin-exec-agent/task/registry-initialization-task";
import { storageAttachmentTask } from "@bin-exec-agent/task/storage-attachment-task";
import { AgentBuilder } from "@core-lib/agent/agent-builder";

AgentBuilder
    .lifecycleOperation(binaryExecutionLifecycleOperation)
    .additionalTask(platformCompatibilityCheckTask)
    .additionalTask(storageAttachmentTask)
    .additionalTask(registryInitializationTask)
    .run();
