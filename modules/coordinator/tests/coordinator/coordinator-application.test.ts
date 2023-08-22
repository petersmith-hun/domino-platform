import { CoordinatorApplication } from "@coordinator/coordinator-application";
import { AppInfoConfig } from "@coordinator/core/config/app-info-config-module";
import { ServerConfig } from "@coordinator/core/config/server-config-module";
import { ControllerRegistration } from "@coordinator/web/controller-registration";
import { Router } from "express";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for CoordinatorApplication", () => {

    const serverConfig = {
        contextPath: "/",
        host: "127.0.0.1",
        port: 1111
    } as ServerConfig;

    const appInfoConfig = {
        version: "1.2.3"
    } as AppInfoConfig;

    let expressMock: SinonStubbedInstance<ExpressStub>;
    let routerMock: Router;
    let controllerRegistrationMock: SinonStubbedInstance<ControllerRegistration>;
    let coordinatorApplication: CoordinatorApplication;

    beforeEach(() => {
        expressMock = sinon.createStubInstance(ExpressStub);
        routerMock = {} as Router;
        controllerRegistrationMock = sinon.createStubInstance(ControllerRegistration);

        // @ts-ignore
        coordinatorApplication = new CoordinatorApplication(serverConfig, appInfoConfig, expressMock, controllerRegistrationMock);
    });

    describe("Test scenarios for #run", () => {

        it("should start and configure the Express application server", () => {

            // given
            expressMock.use.returns(expressMock);
            controllerRegistrationMock.registerRoutes.returns(routerMock);

            // when
            coordinatorApplication.run();

            // then
            sinon.assert.callCount(expressMock.use, 4);
            sinon.assert.called(controllerRegistrationMock.registerRoutes);
            sinon.assert.calledWith(expressMock.use, serverConfig.contextPath, routerMock);
            sinon.assert.calledWith(expressMock.listen, serverConfig.port, serverConfig.host);
        });
    });
});

class ExpressStub {
    use(param1: any, param2?: any): any { }
    listen(port: number, host: string, callback: () => void): void {}
}
