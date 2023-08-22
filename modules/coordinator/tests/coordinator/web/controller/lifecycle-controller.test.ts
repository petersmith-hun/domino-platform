import { DeploymentStatus } from "@coordinator/core/domain";
import { ControllerType } from "@coordinator/web/controller/controller";
import { LifecycleController } from "@coordinator/web/controller/lifecycle-controller";
import { HttpStatus, ResponseWrapper } from "@coordinator/web/model/common";
import { LifecycleResponse } from "@coordinator/web/model/lifecycle";
import { lifecycleRequest, versionedLifecycleRequest } from "@testdata/web";

describe("Unit tests for LifecycleController", () => {

    let lifecycleController: LifecycleController;

    beforeEach(() => {
        lifecycleController = new LifecycleController();
    });

    describe("Test scenarios for #getInfo", () => {

        it("should return dummy response with processing time", async () => {

            // when
            const result = await lifecycleController.getInfo(lifecycleRequest);

            // then
            assertDummyResponse(result, HttpStatus.OK);
        });
    });

    describe("Test scenarios for #deploy", () => {

        it("should return dummy response with processing time for specific version", async () => {

            // when
            const result = await lifecycleController.deploy(versionedLifecycleRequest);

            // then
            assertDummyResponse(result, HttpStatus.CREATED);
        });

        it("should return dummy response with processing time for latest version", async () => {

            // when
            const result = await lifecycleController.deploy(lifecycleRequest);

            // then
            assertDummyResponse(result, HttpStatus.CREATED);
        });
    });

    describe("Test scenarios for #start", () => {

        it("should return dummy response with processing time", async () => {

            // when
            const result = await lifecycleController.start(lifecycleRequest);

            // then
            assertDummyResponse(result, HttpStatus.CREATED);
        });
    });

    describe("Test scenarios for #stop", () => {

        it("should return dummy response with processing time", async () => {

            // when
            const result = await lifecycleController.stop(lifecycleRequest);

            // then
            assertDummyResponse(result, HttpStatus.ACCEPTED);
        });
    });

    describe("Test scenarios for #restart", () => {

        it("should return dummy response with processing time", async () => {

            // when
            const result = await lifecycleController.restart(lifecycleRequest);

            // then
            assertDummyResponse(result, HttpStatus.CREATED);
        });
    });

    function assertDummyResponse(response: ResponseWrapper<LifecycleResponse>, expectedStatus: HttpStatus): void {

        expect(response.status).toBe(expectedStatus);
        expect(response.content?.status).toBe(DeploymentStatus.DEPLOYED);
        expect(response.content?.message).toContain("Processed in");
        const processingTime = parseInt(response.content?.message.match(/[0-9]+/)![0] as string);
        expect(processingTime).toBeGreaterThan(1);
    }

    describe("Test scenarios for #controllerType", () => {

        it("should return ControllerType.LIFECYCLE", () => {

            // when
            const result = lifecycleController.controllerType();

            // then
            expect(result).toBe(ControllerType.LIFECYCLE);
        });
    });
});
