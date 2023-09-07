import { DirectAuthError, GenericError } from "@coordinator/core/error/error-types";
import { InvalidRequestError } from "@coordinator/web/error/api-error-types";
import { ConstraintViolation } from "@coordinator/web/model/common";
import { errorHandlerMiddleware, requestTrackingMiddleware } from "@coordinator/web/utility/middleware";
import { HttpStatus } from "@core-lib/platform/api/common";
import LoggerFactory from "@core-lib/platform/logging";
import { isUUID } from "class-validator";
import { Request, Response } from "express";
import { InsufficientScopeError, InvalidTokenError } from "express-oauth2-jwt-bearer";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for Express middleware functions", () => {

    let requestStub: Request;
    let responseStub: SinonStubbedInstance<Response>;

    beforeEach(() => {
        requestStub = {body: {}} as unknown as Request;
        responseStub = sinon.createStubInstance(ResponseStub) as unknown as SinonStubbedInstance<Response>;
        responseStub.status.returns(responseStub);
    });

    describe("Test scenarios for #errorHandlerMiddleware", () => {

        const violations: ConstraintViolation[] = [{
            message: "Invalid size",
            field: "size",
            constraint: "MaxSize"
        }];

        const scenarios: ErrorScenario[] = [
            {error: new InvalidRequestError(violations), expectedStatus: HttpStatus.BAD_REQUEST},
            {error: new DirectAuthError("auth error"), expectedStatus: HttpStatus.FORBIDDEN},
            {error: new InsufficientScopeError(), expectedStatus: HttpStatus.FORBIDDEN},
            {error: new InvalidTokenError(), expectedStatus: HttpStatus.FORBIDDEN},
            {error: new GenericError("something is wrong"), expectedStatus: HttpStatus.INTERNAL_SERVER_ERROR}
        ];

        scenarios.forEach(scenario => {
            it(`should return expected status ${scenario.expectedStatus} for error ${scenario.error.constructor.name}`, () => {

                // given
                const expectViolationsInfo = scenario.error.constructor.name == InvalidRequestError.name;

                // when
                errorHandlerMiddleware(scenario.error, requestStub, responseStub, () => {});

                // then
                sinon.assert.calledWith(responseStub.status, scenario.expectedStatus);
                sinon.assert.calledWith(responseStub.json, expectViolationsInfo
                    ? {message: scenario.error.message, violations: violations}
                    : {message: scenario.error.message});
            });
        });
    });

    describe("Test scenarios for #requestTrackingMiddleware", () => {

        it("should store requestId in async local storage", async () => {

            // given
            let result = null;
            const next = () => result = LoggerFactory.asyncLocalStorage.getStore()?.requestId;

            // when
            await requestTrackingMiddleware(requestStub, responseStub, next);

            // then
            expect(isUUID(result)).toBe(true);
        });
    });
});

interface ErrorScenario {
    error: any
    expectedStatus: HttpStatus
}

class ResponseStub {
    status(status: number): any {}
    json(body: any): any{}
}
