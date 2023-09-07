import { LoggingConfigModule } from "@core-lib/platform/config/logging-config-module";

describe("Unit tests for LoggingConfigModule", () => {

    let loggingConfigModule: LoggingConfigModule;

    beforeEach(() => {
        loggingConfigModule = new LoggingConfigModule();
    });

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the defined logging configuration", () => {

            // when
            const result = loggingConfigModule.getConfiguration();

            // then
            expect(result).toStrictEqual({
                minLevel: 3,
                enableJsonLogging: true
            });
        });
    });
});
