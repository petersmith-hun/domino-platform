import { AppInfoConfig, appInfoConfigModule } from "@coordinator/core/config/app-info-config-module";
import { ServerConfig, serverConfigModule } from "@coordinator/core/config/server-config-module";
import { controllerRegistration, ControllerRegistration } from "@coordinator/web/controller-registration";
import { errorHandlerMiddleware, requestTrackingMiddleware } from "@coordinator/web/utility/middleware";
import LoggerFactory from "@core-lib/platform/logging";
import express, { Express, json } from "express";

/**
 * Domino application entry point.
 */
export class CoordinatorApplication {

    private readonly logger = LoggerFactory.getLogger(CoordinatorApplication);

    private readonly serverConfig: ServerConfig;
    private readonly appInfoConfig: AppInfoConfig;
    private readonly express: Express;
    private readonly controllerRegistration: ControllerRegistration;

    constructor(serverConfig: ServerConfig, appInfoConfig: AppInfoConfig, express: Express, controllerRegistration: ControllerRegistration) {
        this.serverConfig = serverConfig;
        this.appInfoConfig = appInfoConfig;
        this.express = express;
        this.controllerRegistration = controllerRegistration;
    }

    /**
     * Runs Domino by starting up the application server.
     */
    public run(): void {

        this.express
            .use(json())
            .use(requestTrackingMiddleware)
            .use(this.serverConfig.contextPath, this.controllerRegistration.registerRoutes())
            .use(errorHandlerMiddleware)
            .listen(this.serverConfig.port, this.serverConfig.host, () => {
                this.logger.info(`Domino Coordinator (v${this.appInfoConfig.version}) application is listening at http://${this.serverConfig.host}:${this.serverConfig.port}/`)
            });
    }
}

const coordinatorApplication = new CoordinatorApplication(serverConfigModule.getConfiguration(),
    appInfoConfigModule.getConfiguration(), express(), controllerRegistration);

export default coordinatorApplication;
