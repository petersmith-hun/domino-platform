import { DeploymentInfoResponse, InfoStatus } from "@coordinator/core/service/info";
import { infoResponseProcessor, InfoResponseProcessor } from "@coordinator/core/service/info/info-response-processor";
import { HttpStatus } from "@core-lib/platform/api/common";
import { DeploymentInfo, OptionalDeploymentInfo } from "@core-lib/platform/api/deployment";
import LoggerFactory from "@core-lib/platform/logging";
import request, { AxiosResponse } from "axios";

const nonConfiguredInfoEndpoint: DeploymentInfoResponse = { status: InfoStatus.NON_CONFIGURED };
const misconfiguredInfoEndpoint: DeploymentInfoResponse = { status: InfoStatus.MISCONFIGURED };
const failedInfoRequest: DeploymentInfoResponse = { status: InfoStatus.FAILED };

/**
 * Application info provider component. Uses the deployment's configured info endpoint.
 */
export class InfoProvider {

    private readonly logger = LoggerFactory.getLogger(InfoProvider);

    private readonly infoResponseProcessor: InfoResponseProcessor;

    constructor(infoResponseProcessor: InfoResponseProcessor) {
        this.infoResponseProcessor = infoResponseProcessor;
    }

    /**
     * Retrieves application info for the given deployment.
     * Uses the configured endpoint and returns data based on the set response mapping.
     * Response mapping should be provided in target-source pairs, where the source is a valid JSON path.
     *
     * @param deploymentID ID of the deployment for reporting purposes
     * @param deploymentInfo OptionalDeploymentInfo object containing the info endpoint configuration parameters for the given deployment
     * @returns Promise<DeploymentInfoResponse> resolved info response
     */
    public async getAppInfo(deploymentID: string, deploymentInfo: OptionalDeploymentInfo): Promise<DeploymentInfoResponse> {

        return deploymentInfo.enabled
            ? this.doRequestAppInfo(deploymentInfo)
            : this.skipInfoRequest(deploymentID);
    }

    private doRequestAppInfo(deploymentInfo: DeploymentInfo): Promise<DeploymentInfoResponse> {

        return new Promise(async resolve => {
            try {
                const response = await this.callAppInfoEndpoint(deploymentInfo);
                if (response.status === HttpStatus.OK) {
                    resolve(this.infoResponseProcessor.processSuccessfulResponse(deploymentInfo, response));
                } else {
                    this.logger.error(`Application info endpoint returned response status ${response.status}`);
                    resolve(misconfiguredInfoEndpoint);
                }

            } catch (error: any) {

                this.logger.error(`Failed to reach application info endpoint - reason: ${error?.message}`);
                resolve(failedInfoRequest);
            }
        });
    }

    private callAppInfoEndpoint(deploymentInfo: DeploymentInfo): Promise<AxiosResponse<object>> {

        return request({
            method: "GET",
            url: deploymentInfo.endpoint
        });
    }

    private skipInfoRequest(deploymentID: string) {

        this.logger.info(`Info endpoint is not configured for app=${deploymentID} - skipping`);
        return Promise.resolve(nonConfiguredInfoEndpoint);
    }
}

export const infoProvider = new InfoProvider(infoResponseProcessor);
