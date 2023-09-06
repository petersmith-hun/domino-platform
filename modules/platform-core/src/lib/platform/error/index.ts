import process from "process";
import { ILogObj, Logger } from "tslog";

/**
 * Error to be thrown if a configuration module implementation cannot be initialized.
 */
export class ConfigurationError extends Error {

    constructor(message: string) {
        super(`Failed to process application configuration: ${message}`);
    }
}

/**
 * Signals a fatal, unrecoverable error. Logs the error (if provided, then via the given logger, otherwise to console),
 * then shuts down the application.
 *
 * @param error error object causing the unrecoverable state
 * @param logger optional Logger instance to log the error message with
 */
export const fatal = (error: any, logger?: Logger<ILogObj>): void => {

    const message = `Unrecoverable error occurred, application quits: ${error?.message}`;

    if (logger) {
        logger.error(message);
    } else {
        console.error(message);
    }

    process.exit(1);
}
