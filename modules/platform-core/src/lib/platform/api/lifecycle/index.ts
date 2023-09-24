/**
 * Bridge domain class for describing a lifecycle operation's result.
 */
export interface OperationResult {

    status: DeploymentStatus;
    deployOperation: boolean;
    deployedVersion?: string;
}

/**
 * Bridge domain enum defining the supported deployment version types.
 */
export enum DeploymentVersionType {

    /**
     * Version is purposefully missing from the deployment request, latest is expected to be deployed.
     */
    LATEST = "LATEST",

    /**
     * An exact version is defined in the deployment request.
     */
    EXACT = "EXACT"
}

/**
 * Bridge domain class defining a deployment version to be deployed.
 */
export interface DeploymentVersion {

    versionType: DeploymentVersionType;
    version?: string;
}

/**
 * Supported deployment status responses.
 */
export enum DeploymentStatus {

    UPLOADED = "UPLOADED",
    DEPLOYED = "DEPLOYED",
    DEPLOY_FAILED_UNKNOWN = "DEPLOY_FAILED_UNKNOWN",
    DEPLOY_FAILED_MISSING_VERSION = "DEPLOY_FAILED_MISSING_VERSION",
    UNKNOWN_STARTED = "UNKNOWN_STARTED",
    START_FAILURE = "START_FAILURE",
    STOPPED = "STOPPED",
    STOP_FAILURE = "STOP_FAILURE",
    UNKNOWN_STOPPED = "UNKNOWN_STOPPED",
    HEALTH_CHECK_OK = "HEALTH_CHECK_OK",
    HEALTH_CHECK_FAILURE = "HEALTH_CHECK_FAILURE",
    INVALID_REQUEST = "INVALID_REQUEST",
    TIMEOUT = "TIMEOUT"
}
