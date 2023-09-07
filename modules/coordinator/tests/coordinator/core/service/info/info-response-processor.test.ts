import { InfoStatus } from "@coordinator/core/service/info";
import { InfoResponseProcessor } from "@coordinator/core/service/info/info-response-processor";
import { HttpStatus } from "@core-lib/platform/api/common";
import { deploymentInfo, deploymentInfoResponse } from "@testdata/core";
import { AxiosResponse } from "axios";

describe("Unit tests for InfoResponseProcessor", () => {

    let infoResponseProcessor: InfoResponseProcessor;

    beforeEach(() => {
        infoResponseProcessor = new InfoResponseProcessor();
    });

    describe("Test scenarios for #processSuccessfulResponse", () => {

        it("should return PROVIDED status with populated deployment info", () => {

            // given
            const rawInfoResponse = {
                app: {
                    name: "Leaflet Backend",
                    abbreviation: "LFLT"
                },
                build: {
                    version: "2.0.0"
                }
            };
            const axiosResponse = {
                data: rawInfoResponse,
                status: HttpStatus.OK
            } as AxiosResponse<object>;

            // when
            const result = infoResponseProcessor.processResponse(deploymentInfo, axiosResponse);

            // then
            expect(result).toStrictEqual(deploymentInfoResponse);
        });

        it("should return PROVIDED status with partially populated deployment info", () => {

            // given
            const rawInfoResponse = {
                app: {
                    name: "Leaflet Backend"
                },
                build: {
                    version: "2.0.0"
                }
            };
            const axiosResponse = {
                data: rawInfoResponse,
                status: HttpStatus.OK
            } as AxiosResponse<object>;

            // when
            const result = infoResponseProcessor.processResponse(deploymentInfo, axiosResponse);

            // then
            expect(result).toStrictEqual({
                status: InfoStatus.PROVIDED,
                info: {
                    appName: "Leaflet Backend",
                    version: "2.0.0"
                }
            })
        });

        it("should return MISCONFIGURED status without deployment info on non-200 response", () => {

            // given
            const rawInfoResponse = {
                app: {
                    name: "Leaflet Backend"
                },
                build: {
                    version: "2.0.0"
                }
            };
            const axiosResponse = {
                data: rawInfoResponse,
                status: HttpStatus.NOT_FOUND
            } as AxiosResponse<object>;

            // when
            const result = infoResponseProcessor.processResponse(deploymentInfo, axiosResponse);

            // then
            expect(result).toStrictEqual({
                status: InfoStatus.MISCONFIGURED
            })
        });
    });
});
