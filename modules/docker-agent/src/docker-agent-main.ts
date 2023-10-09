import { AgentBuilder } from "@core-lib/agent/agent-builder";
import { dockerLifecycleOperation } from "@docker-agent/service/docker-lifecycle-operation";
import { dockerIdentificationTask } from "@docker-agent/task/docker-identification-task";

AgentBuilder
    .lifecycleOperation(dockerLifecycleOperation)
    .additionalTask(dockerIdentificationTask)
    .run();
