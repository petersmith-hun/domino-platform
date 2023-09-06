import { ActuatorController } from "@coordinator/web/controller/actuator-controller";
import { ControllerType } from "@coordinator/web/controller/controller";
import { HttpStatus } from "@core-lib/platform/api/common";
import { appInfoConfig, infoResponse } from "@testdata/web";

describe("Unit tests for ActuatorController", () => {

    let actuatorController: ActuatorController;

    beforeEach(() => {
        actuatorController = new ActuatorController(appInfoConfig);
    });

    describe("Test scenarios for #info", () => {

        it("should return app info with OK status", () => {

            // when
            const result = actuatorController.info();

            // then
            expect(result).not.toBeNull();
            expect(result.status).toBe(HttpStatus.OK);
            expect(result.content).toStrictEqual(infoResponse);
        });
    });

    describe("Test scenarios for #health", () => {

        it("should return app health with OK status", () => {

            // when
            const result = actuatorController.health();

            // then
            expect(result).not.toBeNull();
            expect(result.status).toBe(HttpStatus.OK);
            expect(result.content!.status).toStrictEqual("UP");
        });
    });

    describe("Test scenarios for #controllerType", () => {

        it("should return ControllerType.ACTUATOR", () => {

            // when
            const result = actuatorController.controllerType();

            // then
            expect(result).toBe(ControllerType.ACTUATOR);
        });
    });
});
