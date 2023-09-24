import { AgentConfig, agentConfigModule } from "@coordinator/core/config/agent-config-module";
import { DeploymentStatus, OperationResult } from "@core-lib/platform/api/lifecycle";
import { Failure } from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";
import ms from "ms";

/**
 * Wrapper class for tracking active commands. Internally creates a Promise, that can be passed to the caller to await
 * on its resolution or rejection. As a safety measure, it also instantiates a timeout object, automatically destroying
 * the tracked ActiveCommand object after a certain (configurable) amount of time.
 */
class ActiveCommand {

    private resolution!: (operationResult: OperationResult) => void;
    private rejection!: (failure: Failure) => void;
    private readonly timeout: NodeJS.Timeout
    readonly promise: Promise<OperationResult>;

    constructor(timeout: (resolution: any) => NodeJS.Timeout) {
        this.promise = new Promise((resolve, reject) => {
            this.resolution = resolve;
            this.rejection = reject;
        });
        this.timeout = timeout(this.resolution);
    }

    /**
     * Marks the tracked command as finished, resolving the stored Promise with the received OperationResult message.
     *
     * @param result OperationResult object to be passed to the original caller
     */
    finished(result: OperationResult): void {
        this.resolution(result);
        clearTimeout(this.timeout);
    }

    /**
     * Marks the tracked command as failed, rejecting the stored Promise with the received Failure message wrapped in
     * an Error object.
     *
     * @param failure Failed object to be passed to the original caller
     */
    failed(failure: Failure): void {
        this.rejection(new Error(failure.message));
        clearTimeout(this.timeout);
    }
}

const timeoutOperationResult: OperationResult = {
    deployOperation: false,
    status: DeploymentStatus.TIMEOUT
};

/**
 * Registry implementation storing active lifecycle operations. Can be used as link between the asynchronous lifecycle
 * operation result handler and the synchronous lifecycle operation service, which is propagating the result to the
 * lifecycle operation controller.
 */
export class LifecycleOperationRegistry {

    private readonly logger = LoggerFactory.getLogger(LifecycleOperationRegistry);

    private readonly activeCommands = new Map<string, ActiveCommand>;
    private readonly operationTimeout: number;

    constructor(agentConfig: AgentConfig) {
        this.operationTimeout = agentConfig.operationTimeout;
    }

    /**
     * Starts tracking a lifecycle operation by creating an object with the following parameters and storing it in a map,
     * indexed by the given message ID:
     *  - resolution function: to be called upon receiving a lifecycle operation result message;
     *  - rejection function: to be called upon receiving a failure message from the agent;
     *  - timeout: to avoid having stuck requests (for instance the agent disconnects after receiving the request),
     *    requests are terminated (with rejection) after a certain (configurable) amount of time.
     * The returned Promise object can be directly used for synchronously waiting for the result.
     *
     * @param messageID ID of the outgoing lifecycle operation message
     */
    public operationStarted(messageID: string): Promise<OperationResult> {

        const timeout = (resolution: any) => setTimeout(() => {
            this.logger.error(`Active lifecycle operation [${messageID}] timed out after [${ms(this.operationTimeout)}]`);
            resolution(timeoutOperationResult);
            this.activeCommands.delete(messageID);
        }, this.operationTimeout);

        const activeCommand = new ActiveCommand(timeout);
        this.activeCommands.set(messageID, activeCommand);

        return activeCommand.promise;
    }

    /**
     * Passes the result to the caller by triggering the stored Promise resolution function. Also cancels the automatic
     * timeout and deletes the stored reference for this tracked operation.
     *
     * @param messageID ID of the outgoing lifecycle operation message
     * @param operationResult OperationResult message coming from the agent
     */
    public operationFinished(messageID: string, operationResult: OperationResult): void {
        this.handleCommandResult(messageID, activeCommand => activeCommand.finished(operationResult));
    }

    /**
     * Passes the failure message wrapped in an Error to the caller by triggering the stored Promise rejection function.
     * Also cancels the automatic timeout and deletes the stored reference for this tracked operation.
     *
     * @param messageID ID of the outgoing lifecycle operation message
     * @param failure Failure message coming from the agent
     */
    public operationFailed(messageID: string, failure: Failure): void {
        this.handleCommandResult(messageID, activeCommand => activeCommand.failed(failure));
    }

    private handleCommandResult(messageID: string, promiseHandler: (activeCommand: ActiveCommand) => void): void {

        const activeCommand = this.activeCommands.get(messageID);
        if (activeCommand) {
            promiseHandler(activeCommand);
            this.activeCommands.delete(messageID);
        } else {
            this.logger.warn(`Unknown message [${messageID}]`);
        }
    }
}

export const lifecycleCommandRegistry = new LifecycleOperationRegistry(agentConfigModule.getConfiguration());
