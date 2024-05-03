import { ServiceHandlerType } from "@bin-exec-agent/domain/common";

/**
 * Interface for implementations handling OS service calls.
 * Every implementation should handle a specific kind of service executor based on the used OS.
 */
export interface ServiceAdapter {

    /**
     * Starts the service.
     *
     * @param serviceName name of the service to be started
     */
    start(serviceName: string): void;

    /**
     * Stops the service.
     *
     * @param serviceName name of the service to be stopped
     */
    stop(serviceName: string): void;

    /**
     * Restarts the service.
     *
     * @param serviceName name of the service to be restarted
     */
    restart(serviceName: string): void;

    /**
     * Defines the compatible service handler type for this implementation.
     */
    forServiceHandler(): ServiceHandlerType;
}
