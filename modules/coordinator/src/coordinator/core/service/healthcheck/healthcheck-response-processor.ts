import { HttpStatus } from "@core-lib/platform/api/common";
import { DeploymentHealthcheck } from "@core-lib/platform/api/deployment";
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
     * @param healthcheck healthcheck configuration parameters of the deployment
     * @param status HTTP status of the healthcheck request
     * @param attemptsLeft number of remaining healthcheck attempts
     */
    public handleResponse(deploymentID: string, healthcheck: DeploymentHealthcheck, status: HttpStatus, attemptsLeft: number): OptionalDeploymentStatus {

        return status === HttpStatus.OK
            ? this.reportSuccessfulHealthcheck(deploymentID)
            : this.reportFailedHealthcheck(status, attemptsLeft, healthcheck);
    }

    private reportSuccessfulHealthcheck(deploymentID: string): DeploymentStatus {

        this.logger.info(`Application=${deploymentID} reports successful healthcheck.`);
        return DeploymentStatus.HEALTH_CHECK_OK;
    }

    private reportFailedHealthcheck(status: HttpStatus, attemptsLeft: number, healthcheck: DeploymentHealthcheck): OptionalDeploymentStatus {

        this.logger.warn(`Healthcheck returned with status=${status}`);

        let deploymentStatus: OptionalDeploymentStatus;
        if (attemptsLeft === 0) {
            this.logger.error(`Number of healthcheck attempts reached limit=${healthcheck.maxAttempts} - app is supposedly down`);
            deploymentStatus = DeploymentStatus.HEALTH_CHECK_FAILURE;
        } else {
            this.logger.info(`Waiting for healthcheck... (${attemptsLeft} attempts left)`);
        }

        return deploymentStatus;
    }
}

export const healthcheckResponseProcessor = new HealthcheckResponseProcessor();
