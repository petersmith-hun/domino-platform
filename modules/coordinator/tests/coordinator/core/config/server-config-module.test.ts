import { ServerConfigModule } from "@coordinator/core/config/server-config-module";

describe("Unit tests for ServerConfigModule", () => {

    let serverConfigModule: ServerConfigModule;

    beforeEach(() => {
        serverConfigModule = new ServerConfigModule();
    });

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the configuration values provided in test.yml", () => {

            // when
            const result = serverConfigModule.getConfiguration();

            // then
            expect(result).toStrictEqual({
                contextPath: "/",
                host: "127.0.0.1",
                port: 1111
            });
        });
    });
});
