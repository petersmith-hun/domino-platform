import LoggerFactory from "@core-lib/platform/logging";

describe("Unit tests for LoggerFactory", () => {

    describe("Test scenarios for #getLogger", () => {

        it("should return a properly configured logger with the given name", () => {

            // given
            const consoleContent: any[] = [];

            // when
            const result = LoggerFactory.getLogger("TestLogger");
            result.attachTransport(record => {
                consoleContent.push(record);
            });
            result.info("This is a log message 1");

            // then
            expect(consoleContent.length).toBe(1);
            const logMessage: any = consoleContent[0];
            expect(logMessage["0"]).toBe("This is a log message 1");
            expect(logMessage._logMeta.logLevelName).toBe("INFO");
            expect(logMessage._logMeta.name).toBe("TestLogger");
        });

        it("should return a properly configured logger for the given class", () => {

            // given
            const consoleContent: any[] = [];

            // when
            const result = LoggerFactory.getLogger(LoggerFactory);
            result.attachTransport(record => {
                consoleContent.push(record);
            });
            result.warn("This is a log message 2");

            // then
            expect(consoleContent.length).toBe(1);
            const logMessage: any = consoleContent[0];
            expect(logMessage["0"]).toBe("This is a log message 2");
            expect(logMessage._logMeta.logLevelName).toBe("WARN");
            expect(logMessage._logMeta.name).toBe("LoggerFactory");
        });
    });
});
