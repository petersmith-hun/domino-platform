import { ExecutorUserRegistry } from "@bin-exec-agent/registry/executor-user-registry";
import { CommandLineUtility } from "@bin-exec-agent/utility/command-line-utility";
import { executorUserLeaflet, spawnControlConfig, spawnControlConfigInvalidUsers } from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for ExecutorUserRegistry", () => {

    let commandLineUtilityMock: SinonStubbedInstance<CommandLineUtility>;
    let executorUserRegistry: ExecutorUserRegistry;

    beforeEach(() => {
        commandLineUtilityMock = sinon.createStubInstance(CommandLineUtility);

        executorUserRegistry = new ExecutorUserRegistry(spawnControlConfig, commandLineUtilityMock);
    });

    describe("Test scenarios for #initialize", () => {

        it("should initialize executor user registry successfully", () => {

            // given
            initMocks();

            // when
            executorUserRegistry.initialize();

            // then
            // silent pass expected
        });

        it("should throw error due to invalid username", () => {

            // given
            executorUserRegistry = new ExecutorUserRegistry(spawnControlConfigInvalidUsers, commandLineUtilityMock);

            // when
            const failingCall = () => executorUserRegistry.initialize();

            // then
            expect(failingCall).toThrowError("Username leaflet$$ is invalid");
        });

        it("should throw error due to unknown user", () => {

            // given
            commandLineUtilityMock.execute.withArgs("id -u leaflet").returns("User not found");

            // when
            const failingCall = () => executorUserRegistry.initialize();

            // then
            expect(failingCall).toThrowError("Could not process user by username leaflet");
        });
    });

    describe("Test scenarios for #getUser", () => {

        it("should return registered user", () => {

            // given
            initMocks();
            executorUserRegistry.initialize();

            // when
            const result = executorUserRegistry.getUser("leaflet");

            // then
            expect(result).toStrictEqual(executorUserLeaflet);
        });

        it("should throw error for non-registered user", () => {

            // given
            initMocks();
            executorUserRegistry.initialize();

            // when
            const failingCall = () => executorUserRegistry.getUser("non-registered-user");

            // then
            expect(failingCall).toThrowError("User non-registered-user is not registered as allowed executor user");
        });

        it("should throw error it registry is not yet initialized", () => {

            // when
            const failingCall = () => executorUserRegistry.getUser("leaflet");

            // then
            expect(failingCall).toThrowError("Executor user registry is not yet initialized");
        });
    });

    function initMocks(): void {

        commandLineUtilityMock.execute.withArgs("id -u leaflet").returns("1000");
        commandLineUtilityMock.execute.withArgs("id -g leaflet").returns("1001");
        commandLineUtilityMock.execute.withArgs("id -u domino").returns("1002");
        commandLineUtilityMock.execute.withArgs("id -g domino").returns("1003");
    }
});
