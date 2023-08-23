import { AuthConfig, AuthMode } from "@coordinator/core/config/auth-config-module";
import { Scope } from "@coordinator/web/model/common";
import { AuthorizationHelper } from "@coordinator/web/utility/authorization-helper";
import { JWTUtility } from "@coordinator/web/utility/jwt-utility";
import { Request, Response } from "express";
import sinon, { SinonSpy, SinonStubbedInstance } from "sinon";

describe("Unit tests for AuthorizationHelper", () => {

    const oAuthAuthConfig = {
        authMode: AuthMode.OAUTH,
        oAuthIssuer: "http://localhost:9999/",
        oAuthAudience: "aud:domino:test"
    } as AuthConfig;

    const directAuthConfig = {
        authMode: AuthMode.DIRECT
    } as AuthConfig;

    const authorizationHeaderValue = "Bearer jwt-token-1";

    let requestMock: Request;
    let responseMock: Response;
    let nextMock: SinonSpy;
    let authStub: SinonSpy;
    let requiredScopeStub: SinonSpy;
    let jwtUtilityMock: SinonStubbedInstance<JWTUtility>;
    let authorizationHelper: AuthorizationHelper;

    beforeAll(async () => {
        const expressJWTBearer = await import("express-oauth2-jwt-bearer");
        authStub = sinon.stub(expressJWTBearer, "auth");
        requiredScopeStub = sinon.stub(expressJWTBearer, "requiredScopes");
    });

    beforeEach(() => {
        requestMock = { headers: { authorization: authorizationHeaderValue } } as Request;
        responseMock = {} as Response;
        nextMock = sinon.fake();
        jwtUtilityMock = sinon.createStubInstance(JWTUtility);
        authStub.resetHistory();
        requiredScopeStub.resetHistory();
    });

    afterAll(() => {
        authStub.restore();
        requiredScopeStub.restore();
    });

    describe("Test scenarios for #prepareAuth", () => {

        it("should create request handler chain for OAuth authorization", () => {

            // given
            prepareAuthorizationHelper(AuthMode.OAUTH);

            // when
            const result = authorizationHelper.prepareAuth();
            result(Scope.WRITE_DEPLOY);

            // then
            expect(result).not.toBeNull();

            sinon.assert.calledWith(authStub, {
                issuerBaseURL: oAuthAuthConfig.oAuthIssuer,
                audience: oAuthAuthConfig.oAuthAudience
            });
            sinon.assert.calledWith(requiredScopeStub, Scope.WRITE_DEPLOY);
            sinon.assert.notCalled(jwtUtilityMock.verifyToken);
        });

        it("should create request handler chain for direct authorization", () => {

            // given
            prepareAuthorizationHelper(AuthMode.DIRECT);

            // when
            const result = authorizationHelper.prepareAuth();
            result(Scope.WRITE_DEPLOY)[0](requestMock, responseMock, nextMock);

            // then
            expect(result).not.toBeNull();

            sinon.assert.calledWith(jwtUtilityMock.verifyToken, authorizationHeaderValue);
            sinon.assert.called(nextMock);
            sinon.assert.notCalled(authStub);
            sinon.assert.notCalled(requiredScopeStub);
        });
    });

    function prepareAuthorizationHelper(authMode: AuthMode): void {

        const authConfig = authMode == AuthMode.OAUTH
            ? oAuthAuthConfig
            : directAuthConfig;

        authorizationHelper = new AuthorizationHelper(authConfig, jwtUtilityMock);
    }
});
