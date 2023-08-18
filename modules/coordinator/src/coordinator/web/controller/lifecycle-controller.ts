import { DeploymentStatus } from "@coordinator/core/domain";
import { Controller, ControllerType, getProcessingTime } from "@coordinator/web/controller/controller";
import { HttpStatus, ResponseWrapper } from "@coordinator/web/model/common";
import {
    DeploymentResponse,
    LifecycleRequest,
    LifecycleResponse,
    VersionedLifecycleRequest
} from "@coordinator/web/model/lifecycle";
import LoggerFactory from "@core-lib/platform/logging";

/**
 * Controller implementation to handle lifecycle of registered applications.
 */
export class LifecycleController implements Controller {

    private readonly logger = LoggerFactory.getLogger(LifecycleController);

    /**
     * GET /lifecycle/:app/info
     * Retrieves information of the given application.
     *
     * @param lifecycleRequest LifecycleRequest object containing information about the target deployment
     */
    async getInfo(lifecycleRequest: LifecycleRequest): Promise<ResponseWrapper<object>> {

        this.logger.info(`Requested info for deployment=${lifecycleRequest.deployment}`);

        return new ResponseWrapper(HttpStatus.OK, this.dummyResponse(lifecycleRequest));
    }

    /**
     * PUT /lifecycle/:app/deploy[/:version]
     * Prepares given application for execution.
     * Omitting version path parameter instructs Domino to select the latest available version.
     *
     * @param lifecycleRequest VersionedLifecycleRequest object containing information about the target deployment
     */
    async deploy(lifecycleRequest: VersionedLifecycleRequest): Promise<ResponseWrapper<DeploymentResponse>> {

        this.logger.info(`Requested updating deployment=${lifecycleRequest.deployment} to version=${lifecycleRequest.version ?? "latest"}`);

        return new ResponseWrapper(HttpStatus.CREATED, this.dummyResponse(lifecycleRequest));
    }

    /**
     * PUT /lifecycle/:app/start
     * Starts the currently deployed version of the given application.
     *
     * @param lifecycleRequest LifecycleRequest object containing information about the target deployment
     */
    async start(lifecycleRequest: LifecycleRequest): Promise<ResponseWrapper<LifecycleResponse>> {

        this.logger.info(`Starting deployment=${lifecycleRequest.deployment}...`);

        return new ResponseWrapper(HttpStatus.CREATED, this.dummyResponse(lifecycleRequest));
    }

    /**
     * DELETE /lifecycle/:app/stop
     * Stops the currently deployed version of the given application.
     *
     * @param lifecycleRequest LifecycleRequest object containing information about the target deployment
     */
    async stop(lifecycleRequest: LifecycleRequest): Promise<ResponseWrapper<LifecycleResponse>> {

        this.logger.info(`Stopping deployment=${lifecycleRequest.deployment}...`);

        return new ResponseWrapper(HttpStatus.ACCEPTED, this.dummyResponse(lifecycleRequest));
    }

    /**
     * PUT /lifecycle/:app/restart
     * Restarts the currently deployed version of the given application.
     *
     * @param lifecycleRequest LifecycleRequest object containing information about the target deployment
     */
    async restart(lifecycleRequest: LifecycleRequest): Promise<ResponseWrapper<LifecycleResponse>> {

        this.logger.info(`Restarting deployment=${lifecycleRequest.deployment}...`);

        return new ResponseWrapper(HttpStatus.CREATED, this.dummyResponse(lifecycleRequest));
    }

    private dummyResponse(lifecycleRequest: LifecycleRequest): DeploymentResponse {

        return {
            message: `Processed in ${getProcessingTime(lifecycleRequest.callStartTime)}`,
            status: DeploymentStatus.DEPLOYED,
            version: "latest"
        }
    }

    controllerType(): ControllerType {
        return ControllerType.LIFECYCLE;
    }
}

export const lifecycleController = new LifecycleController();
