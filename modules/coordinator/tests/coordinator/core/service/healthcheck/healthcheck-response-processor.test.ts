import { HealthcheckResponseProcessor } from "@coordinator/core/service/healthcheck/healthcheck-response-processor";
import { HttpStatus } from "@core-lib/platform/api/common";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import { firstAttempt, lastAttempt } from "@testdata/core";

describe("Unit tests for HealthcheckResponseProcessor", () => {

    let healthcheckResponseProcessor: HealthcheckResponseProcessor;

    beforeEach(() => {
        healthcheckResponseProcessor = new HealthcheckResponseProcessor();
    });

    describe("Test scenarios for #handleResponse", () => {

        it("should return HEALTH_CHECK_OK on success", () => {

            // when
            const result = healthcheckResponseProcessor.handleResponse("app", HttpStatus.OK, firstAttempt);

            // then
            expect(result).toBe(DeploymentStatus.HEALTH_CHECK_OK);
        });

        it("should return undefined status on failure when retry is still possible", () => {

            // when
            const result = healthcheckResponseProcessor.handleResponse("app", HttpStatus.INTERNAL_SERVER_ERROR, firstAttempt);

            // then
            expect(result).toBeUndefined();
        });

        it("should return HEALTH_CHECK_FAILURE on failure when there are no more attempts", () => {

            // when
            const result = healthcheckResponseProcessor.handleResponse("app", HttpStatus.INTERNAL_SERVER_ERROR, lastAttempt);

            // then
            expect(result).toBe(DeploymentStatus.HEALTH_CHECK_FAILURE);
        });
    });
});
