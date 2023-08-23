import { AuthConfigModule, AuthMode } from "@coordinator/core/config/auth-config-module";

describe("Unit tests for AuthConfigModule", () => {

    let authConfigModule: AuthConfigModule;

    beforeEach(() => {
        authConfigModule = new AuthConfigModule();
    });

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the configuration values provided in test.ym", () => {

            // when
            const result = authConfigModule.getConfiguration();

            // then
            expect(result).toStrictEqual({
                authMode: AuthMode.DIRECT,
                expiration: "4 hours",
                jwtPrivateKey: "private-key-1",
                username: "user-1",
                password: "pass-1",
                oAuthAudience: "aud:domino:test",
                oAuthIssuer: "http://localhost:9999/"
            });
        });
    });
});
