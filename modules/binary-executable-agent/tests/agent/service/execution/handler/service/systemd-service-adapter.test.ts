import { ServiceHandlerType } from "@bin-exec-agent/domain/common";
import { SystemdServiceAdapter } from "@bin-exec-agent/service/execution/handler/service/systemd-service-adapter";
import { CommandLineUtility } from "@bin-exec-agent/utility/command-line-utility";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for SystemdServiceAdapter", () => {

    let commandLineUtilityMock: SinonStubbedInstance<CommandLineUtility>;
    let systemdServiceAdapter: SystemdServiceAdapter;

    beforeEach(() => {
        commandLineUtilityMock = sinon.createStubInstance(CommandLineUtility);

        systemdServiceAdapter = new SystemdServiceAdapter(commandLineUtilityMock);
    });

    describe("Test scenarios for #start", () => {

        it("should execute service start command for leaflet service", () => {

            // when
            systemdServiceAdapter.start("leaflet");

            // then
            sinon.assert.calledWith(commandLineUtilityMock.execute, "service leaflet start");
        });
    });

    describe("Test scenarios for #stop", () => {

        it("should execute service stop command for domino service", () => {

            // when
            systemdServiceAdapter.stop("domino");

            // then
            sinon.assert.calledWith(commandLineUtilityMock.execute, "service domino stop");
        });
    });

    describe("Test scenarios for #restart", () => {

        it("should execute service restart command for lms service", () => {

            // when
            systemdServiceAdapter.restart("lms");

            // then
            sinon.assert.calledWith(commandLineUtilityMock.execute, "service lms restart");
        });
    });

    describe("Test scenarios for #forServiceHandler", () => {

        it("should always return SYSTEMD handler type", () => {

            // when
            const result = systemdServiceAdapter.forServiceHandler();

            // then
            expect(result).toBe(ServiceHandlerType.SYSTEMD);
        });
    });
});
