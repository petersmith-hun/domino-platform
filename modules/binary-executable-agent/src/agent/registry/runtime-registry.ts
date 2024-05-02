import { RuntimeConfig, runtimeConfigModule } from "@bin-exec-agent/config/runtime-config-module";
import { UnavailableRuntimeError } from "@bin-exec-agent/error";
import { Registry } from "@bin-exec-agent/registry";
import { commandLineUtility, CommandLineUtility } from "@bin-exec-agent/utility/command-line-utility";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Registry implementation to control registered runtimes.
 */
export class RuntimeRegistry implements Registry {

    private readonly logger = LoggerFactory.getLogger(RuntimeRegistry);

    private readonly runtimeConfigMap: Map<string, RuntimeConfig>;
    private readonly commandLineUtility: CommandLineUtility;

    constructor(commandLineUtility: CommandLineUtility, runtimeConfig: RuntimeConfig[]) {
        this.commandLineUtility = commandLineUtility;
        this.runtimeConfigMap = new Map<string, RuntimeConfig>(runtimeConfig
            .map(runtime => [runtime.id, runtime]));
    }

    /**
     * Reads runtime configurations and executes their configured healthcheck command. Upon failure, registration
     * process is terminated.
     */
    initialize(): void {

        this.logger.info("Verifying registered runtimes ...");

        this.runtimeConfigMap
            .forEach((runtime) => this.doHealthcheck(runtime));
    }

    /**
     * Returns the relevant runtime configuration for the given runtime ID.
     *
     * @param id runtime ID (coming from a deployment configuration)
     */
    public getRuntime(id: string): RuntimeConfig {

        const runtime = this.runtimeConfigMap.get(id);
        if (!runtime) {
            throw new UnavailableRuntimeError(`Requested runtime '${id}' is not available`);
        }

        return runtime;
    }

    private doHealthcheck(runtime: RuntimeConfig): void {
        try {
            this.commandLineUtility.execute(`${runtime.binaryPath} ${runtime.healthcheck}`);
            this.logger.info(`Runtime ${runtime.id} is available`);

        } catch (error: any) {
            this.logger.error(`Failed to execute runtime healthcheck: ${error?.message}`);
            throw new UnavailableRuntimeError(`Runtime ${runtime.id} failed to respond to healthcheck command, reason: ${error?.message}`);
        }
    }
}

export const runtimeRegistry = new RuntimeRegistry(commandLineUtility, runtimeConfigModule.getConfiguration());
