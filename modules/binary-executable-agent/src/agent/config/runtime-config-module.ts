import { ConfigurationModule } from "@core-lib/platform/config";

type RuntimeConfigKeys = "id" | "binary-path" | "healthcheck" | "command-line";

/**
 * Runtime configuration descriptor.
 */
export interface RuntimeConfig {

    /**
     * Runtime internal identifier (this ID must be referenced in the deployment configuration).
     */
    id: string;

    /**
     * Runtime executable path.
     */
    binaryPath: string;

    /**
     * Runtime healthcheck command (to test if runtime exists and can run).
     */
    healthcheck: string;

    /**
     * Runtime command (to run the deployment).
     */
    commandLine: string;
}

/**
 * ConfigurationModule implementation for initializing the runtime configuration.
 */
export class RuntimeConfigModule extends ConfigurationModule<RuntimeConfig[], RuntimeConfigKeys>{

    constructor() {
        super("runtimes", runtimesNode => {

            return (runtimesNode as unknown as Array<any>)
                .map(runtime => {
                    return {
                        id: super.getValueFromObject(runtime, "id"),
                        binaryPath: super.getValueFromObject(runtime, "binary-path"),
                        healthcheck: super.getValueFromObject(runtime, "healthcheck"),
                        commandLine: super.getValueFromObject(runtime, "command-line")
                    }
                });
        });

        super.init();
    }
}

export const runtimeConfigModule = new RuntimeConfigModule();
