import { GenericError } from "@coordinator/core/error/error-types";
import { HttpStatus, ResponseWrapper } from "@coordinator/web/model/common";
import { LifecycleRequest, LifecycleResponse } from "@coordinator/web/model/lifecycle";
import { ParameterizedMappingHelper, ParameterlessMappingHelper } from "@coordinator/web/utility/mapping-helper";
import { Request, Response } from "express";
import { hrtime } from "node:process";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";
import { lifecycleRequest, lifecycleResponse } from "@testdata/web";

describe("Unit tests for mapping helper functions", () => {

    let requestStub: Request;
    let responseStub: SinonStubbedInstance<Response>;
    let hrTimeStub: SinonStub;

    beforeEach(() => {
        requestStub = {} as unknown as Request;
        responseStub = sinon.createStubInstance(ResponseStub) as unknown as SinonStubbedInstance<Response>;
    });

    beforeAll(() => {
        hrTimeStub = sinon.stub(hrtime, "bigint");
        hrTimeStub.returns(BigInt(1234));
    });

    afterAll(() => {
        hrTimeStub.restore();
    });

    describe("Test scenarios for ParameterlessMappingHelper#register", () => {

        it("should map successful JSON response", async () => {

            // given
            const responseWrapper: ResponseWrapper<LifecycleResponse> = new ResponseWrapper<LifecycleResponse>(HttpStatus.OK, lifecycleResponse);
            const parameterlessMappingHelper = new ParameterlessMappingHelper();

            // when
            const result = parameterlessMappingHelper.register(async () => responseWrapper);
            await result(requestStub, responseStub, () => {});

            // then
            sinon.assert.calledWith(responseStub.status, HttpStatus.OK);
            sinon.assert.calledWith(responseStub.json, lifecycleResponse);
            sinon.assert.notCalled(responseStub.send);
        });

        it("should map successful empty response", async () => {

            // given
            const responseWrapper: ResponseWrapper<void> = new ResponseWrapper<void>(HttpStatus.CREATED);
            const parameterlessMappingHelper = new ParameterlessMappingHelper();

            // when
            const result = parameterlessMappingHelper.register(async () => responseWrapper);
            await result(requestStub, responseStub, () => {});

            // then
            sinon.assert.calledWith(responseStub.status, HttpStatus.CREATED);
            sinon.assert.called(responseStub.send);
            sinon.assert.notCalled(responseStub.json);
        });

        it("should handle error by passing it forward via next function", async () => {

            // given
            const nextFake = sinon.fake();
            const parameterlessMappingHelper = new ParameterlessMappingHelper();
            const genericError = new GenericError("Something went wrong");

            // when
            const result = parameterlessMappingHelper.register(async () => {
                throw genericError
            });
            await result(requestStub, responseStub, nextFake);

            // then
            sinon.assert.notCalled(responseStub.status);
            sinon.assert.notCalled(responseStub.send);
            sinon.assert.notCalled(responseStub.json);
            sinon.assert.calledWith(nextFake, genericError);
        });
    });

    describe("Test scenarios for ParameterizedMappingHelper#register", () => {

        it("should successfully map request model from Express request", async () => {

            // given
            requestStub = {
                params: lifecycleRequest
            } as unknown as Request;
            const parameterizedMappingHelper = new ParameterizedMappingHelper(LifecycleRequest);

            // when
            const result = parameterizedMappingHelper.register(async (lifecycleRequest) => new ResponseWrapper<LifecycleRequest>(HttpStatus.OK, lifecycleRequest));
            await result(requestStub, responseStub, () => { });

            // then
            sinon.assert.calledWith(responseStub.status, HttpStatus.OK);
            sinon.assert.calledWithMatch(responseStub.json, lifecycleRequest);
        });

        it("should handle input mapping errors", async () => {

            // given
            const nextFake = sinon.fake();
            const parameterizedMappingHelper = new ParameterizedMappingHelper(LifecycleRequest);

            // when
            const result = parameterizedMappingHelper.register(async (lifecycleRequest) => new ResponseWrapper<LifecycleRequest>(HttpStatus.OK, lifecycleRequest));
            // @ts-ignore
            await result(null, responseStub, nextFake);

            // then
            sinon.assert.notCalled(responseStub.status);
            sinon.assert.notCalled(responseStub.json);
            sinon.assert.called(nextFake);
        });
    });
});

class ResponseStub {
    status(status: number): any {}
    send(body?: any): any {}
    json(body: any): any {}
    setHeader(key: string, value: any): any {}
}
