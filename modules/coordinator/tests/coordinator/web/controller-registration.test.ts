import { GenericError } from "@coordinator/core/error/error-types";
import { ControllerRegistration } from "@coordinator/web/controller-registration";
import { ActuatorController } from "@coordinator/web/controller/actuator-controller";
import { AuthenticationController } from "@coordinator/web/controller/authentication-controller";
import { ControllerType } from "@coordinator/web/controller/controller";
import { LifecycleController } from "@coordinator/web/controller/lifecycle-controller";
import { Scope } from "@coordinator/web/model/common";
import { AuthorizationHelper } from "@coordinator/web/utility/authorization-helper";
import { ParameterizedMappingHelper, ParameterlessMappingHelper } from "@coordinator/web/utility/mapping-helper";
import express from "express";
import sinon, { SinonSpy, SinonStub, SinonStubbedInstance } from "sinon";

describe("Unit tests for ControllerRegistration", () => {

    let actuatorControllerMock: SinonStubbedInstance<ActuatorController>;
    let authenticationControllerMock: SinonStubbedInstance<AuthenticationController>;
    let lifecycleControllerMock: SinonStubbedInstance<LifecycleController>;
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
        authorizationHelperMock = sinon.createStubInstance(AuthorizationHelper);
        authorizationHelperMock.prepareAuth.returns(scope => [() => authMock(scope)]);

        controllerRegistration = new ControllerRegistration([
            actuatorControllerMock,
            authenticationControllerMock,
            lifecycleControllerMock
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
