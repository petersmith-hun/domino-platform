import { AppInfoConfig, appInfoConfigModule } from "@coordinator/core/config/app-info-config-module";
import { Controller, ControllerType } from "@coordinator/web/controller/controller";
import { HealthResponse, InfoResponse } from "@coordinator/web/model/actuator";
import { HttpStatus, ResponseWrapper } from "@coordinator/web/model/common";

/**
 * Actuator (application info and health-check) controller.
 */
export class ActuatorController implements Controller {

    private readonly appInfoConfig: AppInfoConfig;
    private infoResponse?: InfoResponse;

    constructor(appInfoConfig: AppInfoConfig) {
        this.appInfoConfig = appInfoConfig;
    }

    /**
     * GET /actuator/info
     *
     * Returns the configured application info data (domino.info.* parameters).
     *
     * @returns application info as InfoResponse wrapped in ResponseWrapper
     */
    public info(): ResponseWrapper<InfoResponse> {

        if (!this.infoResponse) {
            this.infoResponse = this.createInfoResponse();
        }

        return new ResponseWrapper(HttpStatus.OK, this.infoResponse);
    }

    /**
     * GET /actuator/health
     *
     * Returns the configured application health status.
     *
     * @returns application health status as HealthResponse wrapped in ResponseWrapper
     */
    public health(): ResponseWrapper<HealthResponse> {
        return new ResponseWrapper(HttpStatus.OK, new HealthResponse());
    }

    controllerType(): ControllerType {
        return ControllerType.ACTUATOR;
    }

    private createInfoResponse(): InfoResponse {

        return new InfoResponse(
            this.appInfoConfig.applicationName,
            this.appInfoConfig.abbreviation,
            this.appInfoConfig.version,
            this.appInfoConfig.buildTime
        );
    }
}

export const actuatorController = new ActuatorController(appInfoConfigModule.getConfiguration());
