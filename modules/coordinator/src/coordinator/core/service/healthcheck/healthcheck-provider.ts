import {
    healthcheckResponseProcessor,
    HealthcheckResponseProcessor,
    OptionalDeploymentStatus
} from "@coordinator/core/service/healthcheck/healthcheck-response-processor";
import { HttpStatus } from "@core-lib/platform/api/common";
import { DeploymentHealthcheck, OptionalDeploymentHealthcheck } from "@core-lib/platform/api/deployment";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import LoggerFactory from "@core-lib/platform/logging";
import request, { AxiosResponse } from "axios";

/**
 * Component to perform health check of the started applications.
 */
export class HealthcheckProvider {

    private readonly logger = LoggerFactory.getLogger(HealthcheckProvider);

    private readonly healthcheckResponseProcessor: HealthcheckResponseProcessor;

    constructor(healthcheckResponseProcessor: HealthcheckResponseProcessor) {
        this.healthcheckResponseProcessor = healthcheckResponseProcessor;
    }

    /**
     * Starts executing health check. The following steps are done:
     *  - If healthcheck is not configured for the given deployment, immediately returns with UNKNOWN_STARTED status;
     *  - Otherwise, first healthcheck attempt is made after the configured delay;
     *  - If that passes, healthcheck returns with HEALTH_CHECK_OK status;
     *  - Otherwise, healthcheck is attempted the configured max attempts times in total, and if any of those passes,
     *    returns with HEALTH_CHECK_OK, otherwise returns with HEALTH_CHECK_FAILURE.
     *
     * @param deploymentID ID of the deployment for reporting purposes
     * @param healthcheck OptionalDeploymentHealthcheck object containing the healthcheck configuration parameters for the given deployment
     * @returns Promise<DeploymentStatus> resolved healthcheck status
     */
    public async executeHealthcheck(deploymentID: string, healthcheck: OptionalDeploymentHealthcheck): Promise<DeploymentStatus> {

        return healthcheck.enabled
            ? this.doExecuteHealthcheck(deploymentID, healthcheck)
            : this.skipHealthcheck(deploymentID);
    }

    private doExecuteHealthcheck(deploymentID: string, healthcheck: DeploymentHealthcheck): Promise<DeploymentStatus> {

        return new Promise(resolve => {

            let attemptsLeft = healthcheck.maxAttempts;

            this.logger.info(`Executing healthcheck for app=${deploymentID} (delay: ${healthcheck.delay} ms; response timeout: ${healthcheck.timeout} ms)`);
            this.logger.info(`Waiting for health-check... (${attemptsLeft} attempts left)`);

            const callLoop = setInterval(async () => {

                attemptsLeft--;
                let deploymentStatus = await this.tryHealthcheck(healthcheck, deploymentID, attemptsLeft);
                if (deploymentStatus) {
                    this.stopLoop(resolve, callLoop, deploymentStatus);
                }

            }, healthcheck.delay);
        });
    }

    private async tryHealthcheck(healthcheck: DeploymentHealthcheck, deploymentID: string, attemptsLeft: number): Promise<OptionalDeploymentStatus> {

        try {
            const response = await this.callHealthCheckEndpoint(healthcheck);
            return this.healthcheckResponseProcessor.handleResponse(deploymentID, healthcheck, response.status, attemptsLeft);

        } catch (error: any) {
            this.logger.error(`Failed to reach application health-check endpoint - reason: ${error?.message}`);
            return this.healthcheckResponseProcessor.handleResponse(deploymentID, healthcheck, HttpStatus.SERVICE_UNAVAILABLE, attemptsLeft);
        }
    }

    private callHealthCheckEndpoint(healthcheck: DeploymentHealthcheck): Promise<AxiosResponse<unknown>> {

        return request({
            method: "GET",
            url: healthcheck.endpoint,
            timeout: healthcheck.timeout
        });
    }

    private stopLoop(resolve: (deploymentStatus: DeploymentStatus) => void, callLoopHandler: NodeJS.Timeout, deploymentStatus: DeploymentStatus): void {

        clearInterval(callLoopHandler);
        resolve(deploymentStatus);
    }

    private skipHealthcheck(deploymentID: string): Promise<DeploymentStatus> {

        this.logger.info(`Healthcheck execution for app=${deploymentID} is disabled - skipping`);
        return Promise.resolve(DeploymentStatus.UNKNOWN_STARTED);
    }
}

export const healthcheckProvider = new HealthcheckProvider(healthcheckResponseProcessor);
