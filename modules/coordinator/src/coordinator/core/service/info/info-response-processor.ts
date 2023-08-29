import { DeploymentInfoResponse, InfoStatus } from "@coordinator/core/service/info/index";
import { DeploymentInfo } from "@core-lib/platform/api/deployment";
import LoggerFactory from "@core-lib/platform/logging";
import { AxiosResponse } from "axios";
import { JSONPath } from "jsonpath-plus";

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
    public processSuccessfulResponse(deploymentInfo: DeploymentInfo, response: AxiosResponse<object>): DeploymentInfoResponse {

        let infoStatus = InfoStatus.PROVIDED;
        const infoDetailsMap = new Map<string, string>();

        deploymentInfo.fieldMapping.forEach((path, key) => {
            const nodeValue = this.applyPath(response, path);
            if (!nodeValue) {
                infoStatus = InfoStatus.MISCONFIGURED;
                this.logger.warn(`Application info endpoint is misconfigured, retrieved no value on path=${path} - response will be deficient`);
            } else {
                infoDetailsMap.set(key, nodeValue);
            }
        });

        return {
            status: infoStatus,
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
