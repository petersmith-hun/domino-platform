import { ConfigurationModule } from "@core-lib/platform/config";

type LoggingConfigKey = "enable-json-logging" | "min-level";

/**
 * Enum to map the supported logging level configuration values to their corresponding ts-log log level values.
 */
enum LogLevel {

    debug = 2,
    info = 3,
    warn = 4,
    error = 5
}

/**
 * Logging configuration parameters.
 */
export interface LoggingConfig {

    minLevel: LogLevel,
    enableJsonLogging: boolean
}

/**
 * ConfigurationModule implementation for initializing the logging configuration.
 */
export class LoggingConfigModule extends ConfigurationModule<LoggingConfig, LoggingConfigKey> {

    constructor() {
        super("logging", mapNode => {
            return {
                minLevel: LogLevel[super.getValue(mapNode, "min-level", "info") as keyof typeof LogLevel],
                enableJsonLogging: super.getValue(mapNode, "enable-json-logging", false)
            }
        });
        super.init();
    }
}

export const loggingConfigModule = new LoggingConfigModule();
