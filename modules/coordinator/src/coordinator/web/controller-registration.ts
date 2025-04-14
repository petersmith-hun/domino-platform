import { GenericError } from "@coordinator/core/error/error-types";
import { ActuatorController, actuatorController } from "@coordinator/web/controller/actuator-controller";
import {
    AuthenticationController,
    authenticationController
} from "@coordinator/web/controller/authentication-controller";
import { Controller, ControllerType } from "@coordinator/web/controller/controller";
import { DeploymentsController, deploymentsController } from "@coordinator/web/controller/deployments-controller";
import { lifecycleController, LifecycleController } from "@coordinator/web/controller/lifecycle-controller";
import { SecretController, secretController } from "@coordinator/web/controller/secret-controller";
import { DirectAuthRequest } from "@coordinator/web/model/authentication";
import { PageRequest, Scope } from "@coordinator/web/model/common";
import {
    DeploymentCreationRequest,
    DeploymentImportRequest,
    DeploymentUpdateRequest,
    GetDeploymentRequest
} from "@coordinator/web/model/deployment";
import { LifecycleRequest, VersionedLifecycleRequest } from "@coordinator/web/model/lifecycle";
import { ContextAccessRequest, SecretAccessRequest, SecretCreationRequest } from "@coordinator/web/model/secret";
import { authorizationHelper, AuthorizationHelper } from "@coordinator/web/utility/authorization-helper";
import { ParameterizedMappingHelper, ParameterlessMappingHelper } from "@coordinator/web/utility/mapping-helper";
import bodyParser from "body-parser";
import { Request, Router } from "express";

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
        const deploymentsController: DeploymentsController = this.assertAndReturnController(ControllerType.DEPLOYMENTS);
        const lifecycleController: LifecycleController = this.assertAndReturnController(ControllerType.LIFECYCLE);
        const secretController: SecretController = this.assertAndReturnController(ControllerType.SECRET);

        const simple = new ParameterlessMappingHelper();
        const claim = new ParameterizedMappingHelper(DirectAuthRequest);
        const identified = new ParameterizedMappingHelper<string>((request: Request) => request.params.id)
        const lifecycle = new ParameterizedMappingHelper(LifecycleRequest);
        const deploy = new ParameterizedMappingHelper(VersionedLifecycleRequest);
        const paged = new ParameterizedMappingHelper(PageRequest);
        const deploymentCreate = new ParameterizedMappingHelper(DeploymentCreationRequest);
        const deploymentUpdate = new ParameterizedMappingHelper(DeploymentUpdateRequest);
        const deploymentImport = new ParameterizedMappingHelper(DeploymentImportRequest);
        const deployment = new ParameterizedMappingHelper(GetDeploymentRequest);
        const secretAccess = new ParameterizedMappingHelper(SecretAccessRequest);
        const contextAccess = new ParameterizedMappingHelper(ContextAccessRequest);
        const secretCreation = new ParameterizedMappingHelper(SecretCreationRequest);
        const auth = this.authorizationHelper.prepareAuth();

        const actuatorRouter = Router();
        const authenticationRouter = Router();
        const deploymentsRouter = Router();
        const lifecycleRouter = Router();
        const secretRouter = Router();

        actuatorRouter
            .get("/info", simple.register(() => actuatorController.info()))
            .get("/health", simple.register(() => actuatorController.health()));

        authenticationRouter
            .post("/", claim.register(directAuthRequest => authenticationController.claimToken(directAuthRequest)));

        deploymentsRouter
            .get("/", auth(Scope.READ_DEPLOYMENTS), paged.register(request => deploymentsController.listDeployments(request)))
            .post("/", auth(Scope.WRITE_DEPLOYMENTS_CREATE), deploymentCreate.register(deployment => deploymentsController.createDeployment(deployment)))
            .post("/import", auth(Scope.WRITE_DEPLOYMENTS_IMPORT), bodyParser.text(), deploymentImport.register(deployment => deploymentsController.importDeployment(deployment)))
            .get("/:id", auth(Scope.READ_DEPLOYMENTS), deployment.register(deploymentID => deploymentsController.getDeployment(deploymentID)))
            .put("/:id", auth(Scope.WRITE_DEPLOYMENTS_MANAGE), deploymentUpdate.register(deployment => deploymentsController.updateDeployment(deployment)))
            .put("/:id/unlock", auth(Scope.WRITE_DEPLOYMENTS_MANAGE), identified.register(deploymentID => deploymentsController.unlockDeployment(deploymentID)))
            .delete("/:id", auth(Scope.WRITE_DEPLOYMENTS_MANAGE), identified.register(deploymentID => deploymentsController.deleteDeployment(deploymentID)));

        lifecycleRouter
            .get("/:deployment/info", auth(Scope.READ_INFO), lifecycle.register(request => lifecycleController.getInfo(request)))
            .put(["/:deployment/deploy", "/:deployment/deploy/:version"], auth(Scope.WRITE_DEPLOY),
                deploy.register(request => lifecycleController.deploy(request)))
            .put("/:deployment/start", auth(Scope.WRITE_START), lifecycle.register(request => lifecycleController.start(request)))
            .put("/:deployment/restart", auth(Scope.WRITE_RESTART), lifecycle.register(request => lifecycleController.restart(request)))
            .delete("/:deployment/stop", auth(Scope.WRITE_DELETE), lifecycle.register(request => lifecycleController.stop(request)));

        secretRouter
            .get("/", auth(Scope.READ_SECRETS_METADATA), simple.register(() => secretController.retrieveAllSecretMetadata()))
            .get("/context/:context", auth(Scope.READ_SECRETS_RETRIEVE), contextAccess.register(request => secretController.retrieveSecretsByContext(request)))
            .get("/:key", auth(Scope.READ_SECRETS_RETRIEVE), secretAccess.register(request => secretController.retrieveSecret(request)))
            .get("/:key/metadata", auth(Scope.READ_SECRETS_METADATA), secretAccess.register(request => secretController.retrieveSecretMetadata(request)))
            .post("/", auth(Scope.WRITE_SECRETS_CREATE), secretCreation.register(request => secretController.createSecret(request)))
            .put("/:key/retrieval", auth(Scope.WRITE_SECRETS_MANAGE), secretAccess.register(request => secretController.enableRetrieval(request)))
            .delete("/:key/retrieval", auth(Scope.WRITE_SECRETS_MANAGE), secretAccess.register(request => secretController.disableRetrieval(request)))
            .delete("/:key", auth(Scope.WRITE_SECRETS_MANAGE), secretAccess.register(request => secretController.deleteSecret(request)));

        return Router()
            .use("/actuator", actuatorRouter)
            .use("/claim-token", authenticationRouter)
            .use("/deployments", deploymentsRouter)
            .use("/lifecycle", lifecycleRouter)
            .use("/secrets", secretRouter);
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
    deploymentsController,
    lifecycleController,
    secretController
], authorizationHelper);
