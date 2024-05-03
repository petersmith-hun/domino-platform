import { ExecutionType } from "@core-lib/platform/api/deployment";

/**
 * Error to be thrown by failing executor user related operations.
 */
export class ExecutorUserError extends Error {

    constructor(message: string) {
        super(message);
    }
}

/**
 * Error to be thrown when the selected execution strategy is not registered / invalid.
 */
export class UnknownExecutionStrategyError extends Error {

    constructor(executionType: ExecutionType) {
        super(`Unknown execution strategy ${executionType}`);
    }
}

/**
 * Error to be thrown when the selected runtime is not available.
 */
export class UnavailableRuntimeError extends Error {

    constructor(message: string) {
        super(message);
    }
}

/**
 * Error to be thrown by failing service adapter related operations.
 */
export class ServiceAdapterError extends Error {

    constructor(message: string) {
        super(message);
    }
}

/**
 * Error to be thrown when a deployment fails.
 */
export class DeploymentError extends Error {

    constructor(message: string) {
        super(message);
    }
}
