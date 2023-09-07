import { InfoStatus } from "@coordinator/core/service/info";
import { InfoProvider } from "@coordinator/core/service/info/info-provider";
import { InfoResponseProcessor } from "@coordinator/core/service/info/info-response-processor";
import { DeploymentInfo } from "@core-lib/platform/api/deployment";
import { axiosInfoRequest, deploymentInfoResponse, optionalDeploymentInfo } from "@testdata/core";
import axios, { AxiosResponse } from "axios";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";

describe("Unit tests for InfoProvider", () => {

    const deploymentID = "app";
    let requestStub: SinonStub;
    let axiosResponseStub: AxiosResponse<object>;
    let infoResponseProcessorMock: SinonStubbedInstance<InfoResponseProcessor>;
    let infoProvider: InfoProvider;

    beforeAll(async () => {
        requestStub = sinon.stub(axios, "request");
    });

    beforeEach(() => {
        infoResponseProcessorMock = sinon.createStubInstance(InfoResponseProcessor);
        axiosResponseStub = { data: {} } as AxiosResponse<object>;
        infoProvider = new InfoProvider(infoResponseProcessorMock);
    });

    afterAll(() => {
        requestStub.restore();
    });

    describe("Test scenarios for #getAppInfo", () => {

        it("should return deployment info on successful request", async () => {

            // given
            requestStub.withArgs(axiosInfoRequest).resolves(axiosResponseStub);
            infoResponseProcessorMock.processResponse.withArgs(optionalDeploymentInfo as DeploymentInfo, axiosResponseStub).returns(deploymentInfoResponse);

            // when
            const result = await infoProvider.getAppInfo(deploymentID, optionalDeploymentInfo);

            // then
            expect(result).toStrictEqual(deploymentInfoResponse);
        });

        it("should return FAILED status on request error", async () => {

            // given
            requestStub.withArgs(axiosInfoRequest).rejects(new Error("Something went wrong"));

            // when
            const result = await infoProvider.getAppInfo(deploymentID, optionalDeploymentInfo);

            // then
            expect(result).toStrictEqual({ status: InfoStatus.FAILED });
            sinon.assert.notCalled(infoResponseProcessorMock.processResponse);
        });

        it("should return NON_CONFIGURED status if info endpoint is not configured", async () => {

            // when
            const result = await infoProvider.getAppInfo(deploymentID,  { enabled: false });

            // then
            expect(result).toStrictEqual({ status: InfoStatus.NON_CONFIGURED });
            sinon.assert.notCalled(infoResponseProcessorMock.processResponse);
        });
    });
});
