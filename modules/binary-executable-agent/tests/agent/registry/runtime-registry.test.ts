import { RuntimeRegistry } from "@bin-exec-agent/registry/runtime-registry";
import { CommandLineUtility } from "@bin-exec-agent/utility/command-line-utility";
import { runtimeConfig } from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for RuntimeRegistry", () => {

    let commandLineUtilityMock: SinonStubbedInstance<CommandLineUtility>;
    let runtimeRegistry: RuntimeRegistry;

    beforeEach(() => {
        commandLineUtilityMock = sinon.createStubInstance(CommandLineUtility);

        runtimeRegistry = new RuntimeRegistry(commandLineUtilityMock, runtimeConfig);
    });

    describe("Test scenarios for #initialize", () => {

        it("should execute healthcheck for each runtime config", () => {

            // when
            runtimeRegistry.initialize();

            // then
            sinon.assert.calledWith(commandLineUtilityMock.execute, "/usr/bin/runtime1 --version");
            sinon.assert.calledWith(commandLineUtilityMock.execute, "/usr/bin/runtime2 -v");
        });

        it("should throw error on healthcheck failure", () => {

            // given
            commandLineUtilityMock.execute.withArgs("/usr/bin/runtime1 --version")
                .throws(new Error("Something went wrong"));

            // when
            const failingCall = () => runtimeRegistry.initialize();

            // then
            expect(failingCall).toThrowError("Runtime runtime1 failed to respond to healthcheck command, reason: Something went wrong")
        });
    });

    describe("Test scenarios for #getRuntime", () => {

        it("should return registered runtime configuration", () => {

            // when
            const result = runtimeRegistry.getRuntime("runtime1");

            // then
            expect(result).toStrictEqual(runtimeConfig[0]);
        });

        it("should throw error for unregistered runtime", () => {

            // when
            const failingCall = () => runtimeRegistry.getRuntime("unregistered");

            // then
            expect(failingCall).toThrowError("Requested runtime 'unregistered' is not available");
        });
    });
});
