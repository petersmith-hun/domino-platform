import { GenericError } from "@coordinator/core/error/error-types";
import {
    ActuatorController,
    actuatorController
} from "@coordinator/web/controller/actuator-controller";
import {
    AuthenticationController,
    authenticationController
} from "@coordinator/web/controller/authentication-controller";
import { Controller, ControllerType } from "@coordinator/web/controller/controller";
import { lifecycleController, LifecycleController } from "@coordinator/web/controller/lifecycle-controller";
import { DirectAuthRequest } from "@coordinator/web/model/authentication";
import { Scope } from "@coordinator/web/model/common";
import { LifecycleRequest, VersionedLifecycleRequest } from "@coordinator/web/model/lifecycle";
import { authorizationHelper, AuthorizationHelper } from "@coordinator/web/utility/authorization-helper";
import { ParameterizedMappingHelper, ParameterlessMappingHelper } from "@coordinator/web/utility/mapping-helper";
import { Router } from "express";

/**
 * Component to handle controller registrations.
 */
export class ControllerRegistration {

    private readonly controllerMap: Map<ControllerType, Controller>;
    private readonly authorizationHelper: AuthorizationHelper;

    constructor(controllers: Controller[], authorizationHelper: AuthorizationHelper) {
        this.controllerMap = new Map(controllers.map(controller => [controller.controllerType(), controller]));
        this.authorizationHelper = authorizationHelper;
    }

    /**
     * Triggers registering routes.
     *
     * @returns configured Express Router object
     */
    public registerRoutes(): Router {

        const actuatorController: ActuatorController = this.assertAndReturnController(ControllerType.ACTUATOR);
        const authenticationController: AuthenticationController = this.assertAndReturnController(ControllerType.AUTHENTICATION);
        const lifecycleController: LifecycleController = this.assertAndReturnController(ControllerType.LIFECYCLE);

        const simple = new ParameterlessMappingHelper();
        const claim = new ParameterizedMappingHelper(DirectAuthRequest);
        const lifecycle = new ParameterizedMappingHelper(LifecycleRequest);
        const deploy = new ParameterizedMappingHelper(VersionedLifecycleRequest);
        const auth = this.authorizationHelper.prepareAuth();

        const actuatorRouter = Router();
        const authenticationRouter = Router();
        const lifecycleRouter = Router();
        const uploadRouter = Router();

        actuatorRouter
            .get("/info", simple.register(() => actuatorController.info()))
            .get("/health", simple.register(() => actuatorController.health()));

        authenticationRouter
            .post("/", claim.register(directAuthRequest => authenticationController.claimToken(directAuthRequest)));

        lifecycleRouter
            .get("/:deployment/info", auth(Scope.READ_INFO), lifecycle.register(request => lifecycleController.getInfo(request)))
            .put(["/:deployment/deploy", "/:deployment/deploy/:version"], auth(Scope.WRITE_DEPLOY),
                deploy.register(request => lifecycleController.deploy(request)))
            .put("/:deployment/start", auth(Scope.WRITE_START), lifecycle.register(request => lifecycleController.start(request)))
            .put("/:deployment/restart", auth(Scope.WRITE_RESTART), lifecycle.register(request => lifecycleController.restart(request)))
            .delete("/:deployment/stop", auth(Scope.WRITE_DELETE), lifecycle.register(request => lifecycleController.stop(request)))

        return Router()
            .use("/actuator", actuatorRouter)
            .use("/claim-token", authenticationRouter)
            .use("/lifecycle", lifecycleRouter)
            .use("/upload", uploadRouter);
    }

    private assertAndReturnController<Type extends Controller>(controllerType: ControllerType): Type {

        const controller = this.controllerMap.get(controllerType) as Type;
        if (!controller) {
            throw new GenericError(`Failed to register controller=${controllerType} - stopping.`);
        }

        return controller;
    }
}

export const controllerRegistration = new ControllerRegistration([
    actuatorController,
    authenticationController,
    lifecycleController
], authorizationHelper);
