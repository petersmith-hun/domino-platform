import { ConfigurationModule } from "@core-lib/platform/config";
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

        it("should fall back to default value if key is missing", () => {

            // given
            interface Dummy {
                key1: string;
                key2: string;
            }
            class DummyModule extends ConfigurationModule<Dummy, "key-1" | "key-2"> {

                constructor() {
                    super("logging", mapNode => {
                        return {
                            key1: super.getValue(mapNode, "key-1"),
                            key2: super.getValue(mapNode, "key-2", "key-2-default")
                        };
                    });

                    super.init();
                }
            }
            const dummyModule = new DummyModule();

            // when
            const result = dummyModule.getConfiguration();

            // then
            expect(result).toStrictEqual({
                key1: "",
                key2: "key-2-default"
            });
        });

        it("should fall back to default value if node is missing", () => {

            // given
            interface Dummy {
                key1: string;
            }
            class DummyModule extends ConfigurationModule<Dummy, "key-1"> {

                constructor() {
                    super("logging", mapNode => {
                        return {
                            key1: super.getValue(undefined, "key-1", "key-1-default")
                        };
                    });

                    super.init();
                }
            }
            const dummyModule = new DummyModule();

            // when
            const result = dummyModule.getConfiguration();

            // then
            expect(result).toStrictEqual({
                key1: "key-1-default"
            });
        });

        it("should throw error on not initialized configuration module", () => {

            // given
            class DummyModule extends ConfigurationModule<object, "key"> {

                constructor() {
                    super("dummy", mapNode => {
                        return {};
                    });
                }
            }
            const dummyModule = new DummyModule();

            // when
            const failingCall = () => dummyModule.getConfiguration();

            // then
            // exception expected
            expect(failingCall).toThrow("Configuration for path=domino.dummy has not been initialized yet.");
        });
    });
});
