import { Deployment } from "@core-lib/platform/api/deployment";

/**
 * Deployment definition data with its metadata.
 */
export interface ExtendedDeployment extends Deployment {

    metadata: {
        locked: boolean;
        createdAt: Date;
        updatedAt: Date;
    }
}
