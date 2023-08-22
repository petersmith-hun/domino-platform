import LoggerFactory from "@core-lib/platform/logging";

describe("Unit tests for LoggerFactory", () => {

    describe("Test scenarios for #getLogger", () => {

        it("should return a properly configured logger with the given name", () => {

            // given
            const restore = console.log;
            const consoleContent: string[] = [];
            console.log = (message: string): void => {
                consoleContent.push(message);
            }

            // when
            const result = LoggerFactory.getLogger("TestLogger");
            result.info("This is a log message 1");

            // then
            expect(consoleContent.length).toBe(1);
            const logMessage: any = JSON.parse(consoleContent[0]);
            expect(logMessage["0"]).toBe("This is a log message 1");
            expect(logMessage._meta.logLevelName).toBe("INFO");
            expect(logMessage._meta.name).toBe("TestLogger");
            console.log = restore;
        });

        it("should return a properly configured logger for the given class", () => {

            // given
            const restore = console.log;
            const consoleContent: string[] = [];
            console.log = (message: string): void => {
                consoleContent.push(message);
            }

            // when
            const result = LoggerFactory.getLogger(LoggerFactory);
            result.warn("This is a log message 2");

            // then
            expect(consoleContent.length).toBe(1);
            const logMessage: any = JSON.parse(consoleContent[0]);
            expect(logMessage["0"]).toBe("This is a log message 2");
            expect(logMessage._meta.logLevelName).toBe("WARN");
            expect(logMessage._meta.name).toBe("LoggerFactory");
            console.log = restore;
        });
    });
});
