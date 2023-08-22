import { AuthConfig } from "@coordinator/core/config/auth-config-module";
import { DirectAuthError } from "@coordinator/core/error/error-types";
import { DirectAuthRequest } from "@coordinator/web/model/authentication";
import { JWTUtility } from "@coordinator/web/utility/jwt-utility";
import ms from "ms";

describe("Unit tests for JWTUtility", () => {

    const defaultAuthConfig = {
        username: "test-admin",
        password: "$2b$12$b0eO/NiQWfM6MaD6980M5udzb6QMYXCH6OV5F4CxEv3hod45ROqHq",
        jwtPrivateKey: "dcba4321",
        expiration: "1 min"
    } as AuthConfig;

    const shortExpirationAuthConfig = {
        username: "test-admin",
        password: "$2b$12$b0eO/NiQWfM6MaD6980M5udzb6QMYXCH6OV5F4CxEv3hod45ROqHq",
        jwtPrivateKey: "dcba4321",
        expiration: "150ms"
    } as AuthConfig;

    const differentUserAuthConfig = {
        username: "different-user",
        password: "$2b$12$b0eO/NiQWfM6MaD6980M5udzb6QMYXCH6OV5F4CxEv3hod45ROqHq",
        jwtPrivateKey: "dcba4321",
        expiration: "1 min"
    } as AuthConfig;

    let jwtUtility: JWTUtility;

    beforeEach(() => {
        jwtUtility = new JWTUtility(defaultAuthConfig);
    });

    describe("Test scenarios for #createToken", () => {

        it("should successfully authenticate and return token", () => {

            // given
            const validAuthRequest = prepareAuthRequest();

            // when
            const result = jwtUtility.createToken(validAuthRequest);

            // then
            const decodedTokenParts = result.split("\.");
            const header = parseTokenPart(decodedTokenParts[0]);
            const payload = parseTokenPart(decodedTokenParts[1]);

            expect(header.alg).toBe("HS256");
            expect(header.typ).toBe("JWT");
            expect(payload.service).toBe(defaultAuthConfig.username);
            expect(payload.exp - payload.iat).toBe(ms(defaultAuthConfig.expiration as string) / 1000);
            expect(payload.iss).toBe("domino");
        });

        const incorrectCredentialScenarios = [
            prepareAuthRequest("invalid-user"),
            prepareAuthRequest(defaultAuthConfig.username, "invalid-password")
        ];

        incorrectCredentialScenarios.forEach(incorrectCredentials => {

            it(`should fail to authenticate because of incorrect credentials [${incorrectCredentials}]`, () => {

                // when
                const failingCall = () => jwtUtility.createToken(incorrectCredentials);

                // then
                // exception expected
                expect(failingCall).toThrow(DirectAuthError);
                expect(failingCall).toThrow("Authentication failure - invalid claim");
            });
        });

        function parseTokenPart(tokenPart: string) {
            return JSON.parse(Buffer.from(tokenPart, "base64").toString())
        }
    });

    describe("Test scenarios for #verifyToken", () => {

        it("should successfully verify token", () => {

            // given
            const authHeaderValue = `Bearer ${jwtUtility.createToken(prepareAuthRequest())}`;

            // when
            jwtUtility.verifyToken(authHeaderValue);

            // then
            // silent flow-through expected
        });

        const invalidAuthHeaderScenarios = [
            "Bearer not-a-jwt-token",
            "no-bearer-keyword",
            "Basic incorrect:auth-type"
        ];

        invalidAuthHeaderScenarios.forEach(authHeaderValue => {

            it(`should fail because of invalid authorization header [${authHeaderValue}]`, () => {

                // when
                const failingCall = () => jwtUtility.verifyToken(authHeaderValue);

                // then
                // exception expected
                expect(failingCall).toThrow(DirectAuthError);
                expect(failingCall).toThrow("Authentication failure - token verification failed");
            });
        });

        it("should fail because of expired token", async () => {

            // given
            const updatedJWTUtility = new JWTUtility(shortExpirationAuthConfig);
            const token = `Bearer ${updatedJWTUtility.createToken(prepareAuthRequest())}`;

            await wait(200); // token expires

            // when
            const failingCall = () => jwtUtility.verifyToken(token);

            // then
            // exception expected
            expect(failingCall).toThrow(DirectAuthError);
            expect(failingCall).toThrow("Authentication failure - token verification failed");
        });

        it("should fail because of invalid service user", () => {

            // given
            const updatedJWTUtility = new JWTUtility(differentUserAuthConfig);
            const token = `Bearer ${updatedJWTUtility.createToken(prepareAuthRequest(differentUserAuthConfig.username))}`;

            // when
            const failingCall = () => jwtUtility.verifyToken(token);

            // then
            // exception expected
            expect(failingCall).toThrow(DirectAuthError);
            expect(failingCall).toThrow("Authentication failure - token validation failed");
        });
    });

    function prepareAuthRequest(username?: string, password?: string): DirectAuthRequest {

        return {
            username: username || defaultAuthConfig.username,
            password: password || "abcd"
        }
    }

    async function wait(timeout: number) {
        return await new Promise(resolve => setTimeout(resolve, timeout));
    }
});
