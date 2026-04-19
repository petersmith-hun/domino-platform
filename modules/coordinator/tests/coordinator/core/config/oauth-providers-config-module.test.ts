import { OAuthProvidersConfigModule } from "@coordinator/core/config/oauth-providers-config-module";
import { OAuthProviderType } from "@coordinator/core/service/oauth";

describe("Unit tests for OAuthProvidersConfigModule", () => {

    let oAuthProvidersConfigModule: OAuthProvidersConfigModule;

    beforeEach(() => {
        oAuthProvidersConfigModule = new OAuthProvidersConfigModule();
    });

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the configuration values provided in test.yml", () => {

            // when
            const result = oAuthProvidersConfigModule.getConfiguration();

            // then
            expect(result).toStrictEqual({
                providers: [{
                    name: "test-provider",
                    providerType: OAuthProviderType.LAGS,
                    host: "http://localhost:8888"
                }]
            });
        });
    });
});
