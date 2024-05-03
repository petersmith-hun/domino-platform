import { SpawnControlConfig, spawnControlConfigModule } from "@bin-exec-agent/config/spawn-control-config-module";
import { ServiceAdapterError } from "@bin-exec-agent/error";
import { Registry } from "@bin-exec-agent/registry";
import { ServiceAdapter } from "@bin-exec-agent/service/execution/handler/service";
import { systemdServiceAdapter } from "@bin-exec-agent/service/execution/handler/service/systemd-service-adapter";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Registry implementation controlling the configured OS service adapter.
 */
export class ServiceAdapterRegistry implements Registry {

    private readonly logger = LoggerFactory.getLogger(ServiceAdapterRegistry);

    private readonly spawnControlConfig: SpawnControlConfig;
    private readonly serviceAdapters: ServiceAdapter[];
    private selectedServiceAdapter?: ServiceAdapter;

    constructor(spawnControlConfig: SpawnControlConfig, serviceAdapters: ServiceAdapter[]) {
        this.spawnControlConfig = spawnControlConfig;
        this.serviceAdapters = serviceAdapters;
    }

    /**
     * Checks if the configured service adapter is supported. Upon failure, initialization terminates.
     */
    initialize(): void {

        this.selectedServiceAdapter = this.serviceAdapters
            .find(adapter => adapter.forServiceHandler() === this.spawnControlConfig.serviceHandler);

        if (!this.selectedServiceAdapter) {
            throw new ServiceAdapterError(`Configured service adapter ${this.spawnControlConfig.serviceHandler} is not available`);
        }

        this.logger.info(`Service handler ${this.selectedServiceAdapter!.forServiceHandler()} will be used for service execution`);
    }

    /**
     * Returns the configured ServiceAdapter implementation.
     */
    public getServiceAdapter(): ServiceAdapter {

        if (!this.selectedServiceAdapter) {
            throw new ServiceAdapterError("Service adapter registry is not initialized");
        }

        return this.selectedServiceAdapter;
    }
}

export const serviceAdapterRegistry = new ServiceAdapterRegistry(spawnControlConfigModule.getConfiguration(), [
    systemdServiceAdapter
]);
