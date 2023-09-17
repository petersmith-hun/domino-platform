import { ReadOnlyAttempt } from "@coordinator/core/service/healthcheck";
import { HttpStatus } from "@core-lib/platform/api/common";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import LoggerFactory from "@core-lib/platform/logging";

export type OptionalDeploymentStatus = DeploymentStatus | undefined;

/**
 * Response processor implementation for healthcheck request.
 */
export class HealthcheckResponseProcessor {

    private readonly logger = LoggerFactory.getLogger(HealthcheckResponseProcessor);

    /**
     * Translates the given healthcheck response to DeploymentStatus.
     *
     * @param deploymentID ID of the deployment for reporting purposes
     * @param status HTTP status of the healthcheck request
     * @param attempt Attempt object containing the number of max attempts and the current status
     */
    public handleResponse(deploymentID: string, status: HttpStatus, attempt: ReadOnlyAttempt): OptionalDeploymentStatus {

        return status === HttpStatus.OK
            ? this.reportSuccessfulHealthcheck(deploymentID)
            : this.reportFailedHealthcheck(status, attempt);
    }

    private reportSuccessfulHealthcheck(deploymentID: string): DeploymentStatus {

        this.logger.info(`Application=${deploymentID} reports successful healthcheck.`);
        return DeploymentStatus.HEALTH_CHECK_OK;
    }

    private reportFailedHealthcheck(status: HttpStatus, attempt: ReadOnlyAttempt): OptionalDeploymentStatus {

        this.logger.warn(`Healthcheck returned with status=${status}`);

        let deploymentStatus: OptionalDeploymentStatus;
        if (attempt.isLimitReached()) {
            this.logger.error(`Number of healthcheck attempts reached limit=${attempt.maxAttempts} - app is supposedly down`);
            deploymentStatus = DeploymentStatus.HEALTH_CHECK_FAILURE;
        } else {
            this.logger.info(`Waiting for healthcheck... (${attempt.attemptsLeft} attempts left)`);
        }

        return deploymentStatus;
    }
}

export const healthcheckResponseProcessor = new HealthcheckResponseProcessor();
