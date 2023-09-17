import { DeploymentInfoResponse, InfoStatus } from "@coordinator/core/service/info";
import { HttpStatus } from "@core-lib/platform/api/common";
import { DeploymentInfo } from "@core-lib/platform/api/deployment";
import LoggerFactory from "@core-lib/platform/logging";
import { AxiosResponse } from "axios";
import { JSONPath } from "jsonpath-plus";

const misconfiguredInfoEndpoint: DeploymentInfoResponse = { status: InfoStatus.MISCONFIGURED };

/**
 * Response processor implementation for info request.
 */
export class InfoResponseProcessor {

    private readonly logger = LoggerFactory.getLogger(InfoResponseProcessor);

    /**
     * Transforms the given info endpoint response into DeploymentInfoResponse.
     *
     * @param deploymentInfo info endpoint configuration parameters of the deployment
     * @param response AxiosResponse object containing the raw response to be transformed
     */
    public processResponse(deploymentInfo: DeploymentInfo, response: AxiosResponse<object>): DeploymentInfoResponse {

        let deploymentInfoResponse;
        if (response.status === HttpStatus.OK) {
            deploymentInfoResponse = this.processSuccessfulResponse(deploymentInfo, response);
        } else {
            this.logger.error(`Application info endpoint returned response status ${response.status}`);
            deploymentInfoResponse = misconfiguredInfoEndpoint;
        }

        return deploymentInfoResponse;
    }

    private processSuccessfulResponse(deploymentInfo: DeploymentInfo, response: AxiosResponse<object>): DeploymentInfoResponse {

        const infoDetailsMap = new Map<string, string>();

        deploymentInfo.fieldMapping.forEach((path, key) => {
            const nodeValue = this.applyPath(response, path);
            if (!nodeValue) {
                this.logger.warn(`Application info endpoint is misconfigured, retrieved no value on path=${path} - response will be deficient`);
            } else {
                infoDetailsMap.set(key, nodeValue);
            }
        });

        return {
            status: InfoStatus.PROVIDED,
            info: Object.fromEntries(infoDetailsMap)
        };
    }

    private applyPath(response: AxiosResponse<object>, path: string): string {

        return JSONPath({
            json: response.data,
            path: path,
            wrap: false
        });
    }
}

export const infoResponseProcessor = new InfoResponseProcessor();
