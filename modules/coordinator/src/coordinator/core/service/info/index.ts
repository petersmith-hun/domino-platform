/**
 * Possible application info request response statuses.
 */
export enum InfoStatus {

    /**
     * Info request is fulfilled.
     */
    PROVIDED = "PROVIDED",

    /**
     * Info endpoint of the registration is not configured.
     */
    NON_CONFIGURED = "NON_CONFIGURED",

    /**
     * Info endpoint of the registration is misconfigured, returning unprocessable/malformed data.
     */
    MISCONFIGURED = "MISCONFIGURED",

    /**
     * Failed to reach the registration's info endpoint.
     */
    FAILED = "FAILED"
}

/**
 * Internal domain class representing a response given for a deployment info request.
 */
export interface DeploymentInfoResponse {

    status: InfoStatus;
    info?: object;
}
