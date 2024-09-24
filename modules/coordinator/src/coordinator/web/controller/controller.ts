import { hrtime } from "node:process";

const NS_TO_MS_DIVISOR = BigInt(1000 * 1000);

/**
 * Marker interface for controller implementations.
 */
export interface Controller {

    /**
     * Returns the endpoint group type of the given controller;
     *
     * @returns controller name
     */
    controllerType(): ControllerType;
}

/**
 * Supported controller types (endpoint groups).
 */
export enum ControllerType {
    ACTUATOR = "actuator",
    AUTHENTICATION = "authentication",
    DEPLOYMENTS = "deployments",
    LIFECYCLE = "lifecycle"
}

/**
 * Returns the processing time of the current request in milliseconds.
 * If processing start time is not available, returns 0.
 *
 * @param callStartTime optional call start time
 * @returns processing time in milliseconds.
 */
export const getProcessingTime = (callStartTime: bigint | null): number => {

    let processingTime = 0;
    if (callStartTime) {
        const hrTimeDifference = hrtime.bigint() - callStartTime;
        processingTime = Math.round(Number(hrTimeDifference / NS_TO_MS_DIVISOR));
    }

    return processingTime;
}
