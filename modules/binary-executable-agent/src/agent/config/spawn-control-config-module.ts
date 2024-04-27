import { ServiceHandlerType } from "@bin-exec-agent/domain/common";
import { ConfigurationModule } from "@core-lib/platform/config";
import ms from "ms";

type SpawnControlConfigKey = "service-handler" | "start-delay" | "auto-unpack" | "allowed-executor-users";

/**
 * Process spawning settings.
 */
export interface SpawnControlConfig {

    /**
     * Service subsystem to be used for service-based execution.
     */
    serviceHandler: ServiceHandlerType;

    /**
     * Process start delay on restart (in ms time string format).
     */
    startDelay: number;

    /**
     * Enables automatically unpacking .zip deployment packages.
     */
    autoUnpack: boolean;

    /**
     * List of allowed process executor users. Listed users must exist on the host system.
     */
    allowedExecutorUsers: string[];
}

/**
 * ConfigurationModule implementation for initializing the spawn control configuration.
 */
export class SpawnControlConfigModule extends ConfigurationModule<SpawnControlConfig, SpawnControlConfigKey> {

    constructor() {
        super("spawn-control", spawnControlNode => {
            return {
                serviceHandler: super.getValue(spawnControlNode, "service-handler", "systemd"),
                startDelay: ms(super.getValue(spawnControlNode, "start-delay") as string),
                autoUnpack: super.getValue(spawnControlNode, "auto-unpack", true),
                allowedExecutorUsers: super.getValue(spawnControlNode, "allowed-executor-users")
            }
        });

        super.init();
    }
}

export const spawnControlConfigModule = new SpawnControlConfigModule();
