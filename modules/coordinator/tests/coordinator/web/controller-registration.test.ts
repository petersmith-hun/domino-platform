import { GenericError } from "@coordinator/core/error/error-types";
import { ControllerRegistration } from "@coordinator/web/controller-registration";
import { ActuatorController } from "@coordinator/web/controller/actuator-controller";
import { AuthenticationController } from "@coordinator/web/controller/authentication-controller";
import { ControllerType } from "@coordinator/web/controller/controller";
import { DeploymentsController } from "@coordinator/web/controller/deployments-controller";
import { LifecycleController } from "@coordinator/web/controller/lifecycle-controller";
import { SecretController } from "@coordinator/web/controller/secret-controller";
import { Scope } from "@coordinator/web/model/common";
import { AuthorizationHelper } from "@coordinator/web/utility/authorization-helper";
import { ParameterizedMappingHelper, ParameterlessMappingHelper } from "@coordinator/web/utility/mapping-helper";
import express from "express";
import sinon, { SinonSpy, SinonStub, SinonStubbedInstance } from "sinon";

describe("Unit tests for ControllerRegistration", () => {

    let actuatorControllerMock: SinonStubbedInstance<ActuatorController>;
    let authenticationControllerMock: SinonStubbedInstance<AuthenticationController>;
    let lifecycleControllerMock: SinonStubbedInstance<LifecycleController>;
    let deploymentControllerMock: SinonStubbedInstance<DeploymentsController>;
    let secretControllerMock: SinonStubbedInstance<SecretController>;
    let authorizationHelperMock: SinonStubbedInstance<AuthorizationHelper>;
    let authMock: SinonSpy;
    let controllerRegistration: ControllerRegistration;

    beforeEach(() => {

        authMock = sinon.fake();
        actuatorControllerMock = sinon.createStubInstance(ActuatorController);
        actuatorControllerMock.controllerType.returns(ControllerType.ACTUATOR);
        authenticationControllerMock = sinon.createStubInstance(AuthenticationControllerStub) as unknown as SinonStubbedInstance<AuthenticationController>;
        authenticationControllerMock.controllerType.returns(ControllerType.AUTHENTICATION);
        lifecycleControllerMock = sinon.createStubInstance(LifecycleControllerStub) as unknown as SinonStubbedInstance<LifecycleController>;
        lifecycleControllerMock.controllerType.returns(ControllerType.LIFECYCLE);
        deploymentControllerMock = sinon.createStubInstance(DeploymentsControllerStub) as unknown as SinonStubbedInstance<DeploymentsController>;
        deploymentControllerMock.controllerType.returns(ControllerType.DEPLOYMENTS)
        secretControllerMock = sinon.createStubInstance(SecretControllerStub) as unknown as SinonStubbedInstance<SecretController>;
        secretControllerMock.controllerType.returns(ControllerType.SECRET);
        authorizationHelperMock = sinon.createStubInstance(AuthorizationHelper);
        authorizationHelperMock.prepareAuth.returns(scope => [() => authMock(scope)]);

        controllerRegistration = new ControllerRegistration([
            actuatorControllerMock,
            authenticationControllerMock,
            lifecycleControllerMock,
            deploymentControllerMock,
            secretControllerMock
        ], authorizationHelperMock);
    });

    describe("Test scenarios for #registerRoutes", () => {

        it("should register routes in Express", async () => {

            // given
            // @ts-ignore
            sinon.replace(express, "Router", sinon.fake(() => new RouterStub()));
            const parameterlessHelperStub = sinon.stub(ParameterlessMappingHelper.prototype, "register").returnsArg(0);
            const parameterizedHelperStub = sinon.stub(ParameterizedMappingHelper.prototype, "register").returnsArg(0);

            // when
            const result = controllerRegistration.registerRoutes() as unknown as RouterStub;

            // then
            await _assertRegistration(result, "get", "/actuator", "/info", actuatorControllerMock.info, null, 1);
            await _assertRegistration(result, "get", "/actuator", "/health", actuatorControllerMock.health, null, 1);

            await _assertRegistration(result, "post", "/claim-token", "/", authenticationControllerMock.claimToken, null, 1);

            await _assertRegistration(result, "get", "/lifecycle", "/:deployment/info", lifecycleControllerMock.getInfo, Scope.READ_INFO, 2);
            await _assertRegistration(result, "put", "/lifecycle", ["/:deployment/deploy", "/:deployment/deploy/:version"], lifecycleControllerMock.deploy, Scope.WRITE_DEPLOY, 2);
            await _assertRegistration(result, "put", "/lifecycle", "/:deployment/start", lifecycleControllerMock.start, Scope.WRITE_START, 2);
            await _assertRegistration(result, "put", "/lifecycle", "/:deployment/restart", lifecycleControllerMock.restart, Scope.WRITE_RESTART, 2);
            await _assertRegistration(result, "delete", "/lifecycle", "/:deployment/stop", lifecycleControllerMock.stop, Scope.WRITE_DELETE, 2);

            await _assertRegistration(result, "get", "/deployments", "/", deploymentControllerMock.listDeployments, Scope.READ_DEPLOYMENTS, 2);
            await _assertRegistration(result, "get", "/deployments", "/:id", deploymentControllerMock.getDeployment, Scope.READ_DEPLOYMENTS, 2);
            await _assertRegistration(result, "post", "/deployments", "/", deploymentControllerMock.createDeployment, Scope.WRITE_DEPLOYMENTS_CREATE, 2);
            await _assertRegistration(result, "post", "/deployments", "/import", deploymentControllerMock.importDeployment, Scope.WRITE_DEPLOYMENTS_IMPORT, 3);
            await _assertRegistration(result, "put", "/deployments", "/:id", deploymentControllerMock.updateDeployment, Scope.WRITE_DEPLOYMENTS_MANAGE, 2);
            await _assertRegistration(result, "put", "/deployments", "/:id/unlock", deploymentControllerMock.unlockDeployment, Scope.WRITE_DEPLOYMENTS_MANAGE, 2);
            await _assertRegistration(result, "delete", "/deployments", "/:id", deploymentControllerMock.deleteDeployment, Scope.WRITE_DEPLOYMENTS_MANAGE, 2);

            await _assertRegistration(result, "get", "/secrets", "/", secretControllerMock.retrieveAllSecretMetadata, Scope.READ_SECRETS_METADATA, 2);
            await _assertRegistration(result, "get", "/secrets", "/context/:context", secretControllerMock.retrieveSecretsByContext, Scope.READ_SECRETS_RETRIEVE, 2);
            await _assertRegistration(result, "get", "/secrets", "/:key", secretControllerMock.retrieveSecret, Scope.READ_SECRETS_RETRIEVE, 2);
            await _assertRegistration(result, "get", "/secrets", "/:key/metadata", secretControllerMock.retrieveSecretMetadata, Scope.READ_SECRETS_METADATA, 2);
            await _assertRegistration(result, "post", "/secrets", "/", secretControllerMock.createSecret, Scope.WRITE_SECRETS_CREATE, 2);
            await _assertRegistration(result, "put", "/secrets", "/:key/retrieval", secretControllerMock.enableRetrieval, Scope.WRITE_SECRETS_MANAGE, 2);
            await _assertRegistration(result, "delete", "/secrets", "/:key/retrieval", secretControllerMock.disableRetrieval, Scope.WRITE_SECRETS_MANAGE, 2);
            await _assertRegistration(result, "delete", "/secrets", "/:key", secretControllerMock.deleteSecret, Scope.WRITE_SECRETS_MANAGE, 2);

            parameterlessHelperStub.restore();
            parameterizedHelperStub.restore();
        });

        it("should registration fail due to unknown controller", () => {

            // given
            controllerRegistration = new ControllerRegistration([], authorizationHelperMock);

            // when
            const failingCall = () => controllerRegistration.registerRoutes();

            // then
            // error expected
            expect(failingCall).toThrow(GenericError);
        });
    });

    async function _assertRegistration(router: RouterStub, method: string,
                                       controller: string, path: string | string[],
                                       controllerMock: SinonStub, scope: Scope | null,
                                       numberOfHandlers: number = 2) {

        const controllerGroup = router.root.get(controller);
        const endpoint = controllerGroup!.endpoints
            .find(endpoint => endpoint[0] == method && (endpoint[1] == path || JSON.stringify(endpoint[1]) == JSON.stringify(path)));

        expect(endpoint).not.toBeUndefined();

        const handlers = endpoint.slice(2);

        expect(handlers.length).toBe(numberOfHandlers);

        handlers.pop()();

        await controllerMock.resolves();
        expect(controllerMock.called).toBe(true);
        controllerMock.reset();

        if (handlers.length > 0) {
            if (handlers.length > 1) {
                handlers.pop(); // dropping the text parser for deployment import endpoint
            }
            (handlers.pop()[0])();
        }

        if (scope) {
            sinon.assert.calledWith(authMock, scope);
        } else {
            sinon.assert.notCalled(authMock);
        }
        authMock.resetHistory();
    }
});

class RouterStub {

    endpoints: any[] = [];
    root: Map<string, RouterStub> = new Map<string, RouterStub>();

    currentPrefix: string | null = null;

    get(...args: any[]) {
        this.handleCall(args, "get");
        return this;
    }

    post(...args: any[]) {
        this.handleCall(args, "post");
        return this;
    }

    put(...args: any[]) {
        this.handleCall(args, "put");
        return this;
    }

    delete(...args: any[]) {
        this.handleCall(args, "delete");
        return this;
    }

    route(route: string) {
        this.currentPrefix = route;
        return this;
    }

    use(path: string, router: any) {
        this.root.set(path, router);
        return this;
    }

    private handleCall(args: any[], method: string) {

        if (this.currentPrefix) {
            args.unshift(this.currentPrefix);
        }
        args.unshift(method);
        this.endpoints.push(args);
    }
}

class AuthenticationControllerStub {
    async claimToken(): Promise<void> {}
    controllerType(): any {};
}

class LifecycleControllerStub {
    async getInfo(): Promise<void> {}
    async deploy(): Promise<void> {}
    async start(): Promise<void> {}
    async stop(): Promise<void> {}
    async restart(): Promise<void> {}
    controllerType(): any {};
}

class DeploymentsControllerStub {
    async listDeployments(): Promise<void> {}
    async getDeployment(): Promise<void> {}
    async createDeployment(): Promise<void> {}
    async importDeployment(): Promise<void> {}
    async updateDeployment(): Promise<void> {}
    async unlockDeployment(): Promise<void> {}
    async deleteDeployment(): Promise<void> {}
    controllerType(): any {};
}

class SecretControllerStub {
    async retrieveSecretMetadata(): Promise<void> {}
    async retrieveAllSecretMetadata(): Promise<void> {}
    async retrieveSecret(): Promise<void> {}
    async retrieveSecretsByContext(): Promise<void> {}
    async createSecret(): Promise<void> {}
    async enableRetrieval(): Promise<void> {}
    async disableRetrieval(): Promise<void> {}
    async deleteSecret(): Promise<void> {}
    controllerType(): any {};
}
