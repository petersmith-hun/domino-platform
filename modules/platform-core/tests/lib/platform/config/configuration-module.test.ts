import { ConfigurationModule } from "@core-lib/platform/config";
import { ConfigurationError } from "@core-lib/platform/error";
import process from "process";
import sinon from "sinon";
import { ILogObj, Logger } from "tslog";

describe("Unit tests for ConfigurationModule", () => {

    describe("Test scenarios for #getConfiguration", () => {

        it("should read requested values", () => {

            // given
            interface Dummy {
                keyMandatory: string;
                keyOptional: string;
                keyEmbedded: string;
                keyList: { key5: string, key6: string }[]
            }
            class DummyModule extends ConfigurationModule<Dummy, "key1" | "key2" | "key3" | "map-node" | "list-node" | "key5" | "key6"> {

                constructor() {
                    super("test-node", mapNode => {
                        return {
                            keyMandatory: super.getMandatoryValue(mapNode, "key1"),
                            keyOptional: super.getValue(mapNode, "key2"),
                            keyEmbedded: super.getValue(super.getNode(mapNode, "map-node"), "key3"),
                            keyList: (super.getValue(mapNode, "list-node") as [])
                                .map(item => {
                                    return {
                                        key5: super.getValueFromObject(item, "key5"),
                                        key6: super.getValueFromObject(item, "key6")
                                    }
                                })
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
                keyMandatory: "value1",
                keyOptional: undefined,
                keyEmbedded: "value3",
                keyList: [
                    { key5: "value5", key6: "value6" }
                ]
            });
        });

        it("should throw error on missing mandatory field", () => {

            // given
            const processExitStub = sinon.stub(process, "exit");

            interface Dummy {
                keyMandatory: string;
            }
            class DummyModule extends ConfigurationModule<Dummy, "key2"> {

                constructor() {
                    super("test-node", mapNode => {
                        return {
                            keyMandatory: super.getMandatoryValue(mapNode, "key2")
                        };
                    });

                    super.init();
                }
            }

            // when
            new DummyModule();

            // then
            sinon.assert.calledWith(processExitStub, 1);

            processExitStub.restore();
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
                key1: undefined,
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
                    super("logging", _ => {
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
                    super("dummy", _ => {
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

        it("should stop the application on error during initialization, and log error to console", () => {

            // given
            const processExitStub = sinon.stub(process, "exit");
            const consoleErrorStub = sinon.stub(console, "error");

            class DummyModule extends ConfigurationModule<object, "key"> {

                constructor() {
                    super("logging", _ => {
                        throw new Error("Something went wrong");
                    });

                    super.init();
                }
            }

            // when
            new DummyModule();

            // then
            sinon.assert.calledWith(processExitStub, 1);
            sinon.assert.calledWith(consoleErrorStub, "Unrecoverable error occurred, application quits: Something went wrong");

            processExitStub.restore();
            consoleErrorStub.restore();
        });

        it("should stop the application on error during initialization, and log error to provided logger", () => {

            // given
            const processExitStub = sinon.stub(process, "exit");
            const loggerMock = sinon.createStubInstance(Logger<ILogObj>);

            class DummyModule extends ConfigurationModule<object, "key"> {

                constructor() {
                    super("logging", _ => {
                        throw new Error("Something went wrong");
                    }, loggerMock);

                    super.init();
                }
            }

            // when
            new DummyModule();

            // then
            sinon.assert.calledWith(processExitStub, 1);

            processExitStub.restore();
            sinon.assert.calledWith(loggerMock.error, "Unrecoverable error occurred, application quits: Something went wrong");
        });

        it("should skip initialization on missing optional configuration section, but still throw error on requested the uninitialized config", () => {

            // given
            class DummyModule extends ConfigurationModule<object, "key"> {

                constructor() {
                    super("not-existing", _ => {
                        return {};
                    });

                    super.init(true);
                }
            }

            // when
            const dummyModule = new DummyModule();

            // then
            expect(() => dummyModule.getConfiguration()).toThrow(ConfigurationError);
        });
    });
});
