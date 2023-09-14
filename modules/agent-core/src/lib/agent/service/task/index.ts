import { AgentConfig } from "@core-lib/agent/config/agent-common-config-module";
import { WebSocket } from "ws";

/**
 * Possible agent statuses.
 */
export enum AgentStatus {

    /**
     * Agent is being initialized, preparation tasks are still in progress.
     */
    INITIALIZING = "INITIALIZING",

    /**
     * Agent has announced itself to Coordinator, awaiting confirmation.
     */
    ANNOUNCED = "ANNOUNCED",

    /**
     * Agent is awaiting deployment commands.
     */
    LISTENING = "LISTENING"
}

/**
 * Global context object containing specific agent configuration data (base config, authentication, ID),
 * the agent's current status and the initialized websocket instance.
 */
export interface TaskContext {

    config: AgentConfig;
    agentID: string;
    authorization?: Map<string, string>;
    socket?: WebSocket;
    agentStatus: AgentStatus;
    pingConfirmed?: boolean;
}

/**
 * Possible task statuses.
 */
export enum TaskStatus {

    /**
     * Task has been successfully executed.
     */
    DONE = "DONE",

    /**
     * Task has been executed and its payload is currently listening to further instructions.
     */
    RUNNING = "RUNNING",

    /**
     * Task's payload has been scheduled, will run every once in the defined interval.
     */
    SCHEDULED = "SCHEDULED",

    /**
     * Task failed to execute its payload, usually meaning an unrecoverable error.
     */
    FAILED = "FAILED"
}

/**
 * Wrapper type for reporting a task's execution status.
 */
export interface TaskResult {

    status: TaskStatus;
}

/**
 * Implementations of the Task interface must handle different kinds of processes, that must be executed by all agent.
 */
export interface Task {

    /**
     * Runs the defined task payload. When finished, returns with a TaskResult object to notify the caller about the execution result.
     *
     * @param context TaskContext object containing the necessary pieces of information for any implemented task
     */
    run(context: TaskContext): Promise<TaskResult>;

    /**
     * Returns the descriptive name of the implemented task.
     */
    taskName(): string;
}
