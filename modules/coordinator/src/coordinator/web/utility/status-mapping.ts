import { InfoStatus } from "@coordinator/core/service/info";
import { HttpStatus } from "@core-lib/platform/api/common";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";

const infoStatusMap = new Map<InfoStatus, HttpStatus>([
    [InfoStatus.PROVIDED, HttpStatus.OK],
    [InfoStatus.NON_CONFIGURED, HttpStatus.NOT_FOUND],
    [InfoStatus.MISCONFIGURED, HttpStatus.EXPECTATION_FAILED],
    [InfoStatus.FAILED, HttpStatus.INTERNAL_SERVER_ERROR]
]);

const deploymentStatusMap = new Map<DeploymentStatus, HttpStatus>([
    [DeploymentStatus.UPLOADED, HttpStatus.CREATED],
    [DeploymentStatus.DEPLOYED, HttpStatus.CREATED],
    [DeploymentStatus.STOPPED, HttpStatus.CREATED],
    [DeploymentStatus.HEALTH_CHECK_OK, HttpStatus.CREATED],
    [DeploymentStatus.UNKNOWN_STARTED, HttpStatus.ACCEPTED],
    [DeploymentStatus.UNKNOWN_STOPPED, HttpStatus.ACCEPTED],
    [DeploymentStatus.DEPLOY_FAILED_MISSING_VERSION, HttpStatus.NOT_FOUND],
    [DeploymentStatus.INVALID_REQUEST, HttpStatus.BAD_REQUEST],
    [DeploymentStatus.TIMEOUT, HttpStatus.REQUEST_TIMEOUT],
    [DeploymentStatus.DEPLOY_FAILED_UNKNOWN, HttpStatus.INTERNAL_SERVER_ERROR],
    [DeploymentStatus.START_FAILURE, HttpStatus.INTERNAL_SERVER_ERROR],
    [DeploymentStatus.HEALTH_CHECK_FAILURE, HttpStatus.INTERNAL_SERVER_ERROR],
    [DeploymentStatus.STOP_FAILURE, HttpStatus.INTERNAL_SERVER_ERROR]
]);

/**
 * Maps the given info status (of InfoStatus enum) to a corresponding HTTP status code.
 *
 * @param infoStatus InfoStatus enum value
 * @return mapped HTTP status code
 */
export const mapInfoStatusToStatusCode = (infoStatus: InfoStatus): HttpStatus => {
    return infoStatusMap.get(infoStatus) ?? HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * Maps the given deployment status (of DeploymentStatus enum) to a corresponding HTTP status code.
 *
 * @param deploymentStatus DeploymentStatus enum value
 * @returns mapped HTTP status code
 */
export const mapDeploymentStatusToStatusCode = (deploymentStatus: DeploymentStatus): HttpStatus => {
    return deploymentStatusMap.get(deploymentStatus) ?? HttpStatus.INTERNAL_SERVER_ERROR;
}
