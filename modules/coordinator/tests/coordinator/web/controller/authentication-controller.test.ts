import { AuthConfig, AuthMode } from "@coordinator/core/config/auth-config-module";
import { DirectAuthError } from "@coordinator/core/error/error-types";
import { AuthenticationController } from "@coordinator/web/controller/authentication-controller";
import { ControllerType } from "@coordinator/web/controller/controller";
import { InvalidRequestError } from "@coordinator/web/error/api-error-types";
import { HttpStatus } from "@coordinator/web/model/common";
import { JWTUtility } from "@coordinator/web/utility/jwt-utility";
import { directAuthRequest, directAuthRequestInvalid, directAuthResponse } from "@testdata/web";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for AuthenticationController", () => {

    let jwtUtilityMock: SinonStubbedInstance<JWTUtility>;
    let authenticationController: AuthenticationController;

    beforeEach(() => {
        jwtUtilityMock = sinon.createStubInstance(JWTUtility);
    });

    describe("Test scenarios for #claimToken", () => {

        it("should generate and return a valid access token when enabled", () => {

            // given
            prepareController(AuthMode.DIRECT);
            jwtUtilityMock.createToken.withArgs(directAuthRequest).returns(directAuthResponse.jwt);

            // when
            const result = authenticationController.claimToken(directAuthRequest);

            // then
            expect(result.status).toBe(HttpStatus.CREATED);
            expect(result.content).toStrictEqual(directAuthResponse);
        });

        it("should throw validation error on missing credentials", () => {

            // given
            prepareController(AuthMode.DIRECT);

            // when
            const failingCall = () => authenticationController.claimToken(directAuthRequestInvalid);

            // then
            expect(failingCall).toThrow(InvalidRequestError);
            sinon.assert.notCalled(jwtUtilityMock.createToken);
        });

        it("should throw auth error on disabled direct auth", () => {

            // given
            prepareController(AuthMode.OAUTH);

            // when
            const failingCall = () => authenticationController.claimToken(directAuthRequest);

            // then
            expect(failingCall).toThrow(DirectAuthError);
            sinon.assert.notCalled(jwtUtilityMock.createToken);
        });
    });

    describe("Test scenarios for #controllerType", () => {

        it("should return ControllerType.AUTHENTICATION", () => {

            // given
            prepareController(AuthMode.OAUTH);

            // when
            const result = authenticationController.controllerType();

            // then
            expect(result).toBe(ControllerType.AUTHENTICATION);
        });
    });

    function prepareController(authMode: AuthMode): void {

        const authConfig = { authMode } as AuthConfig;

        authenticationController = new AuthenticationController(jwtUtilityMock, authConfig);
    }
});
