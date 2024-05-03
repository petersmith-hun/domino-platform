import { PIDFileHandler } from "@bin-exec-agent/service/execution/handler/pid-file-handler";
import { ProcessHandler } from "@bin-exec-agent/service/execution/handler/process-handler";
import { CommandLineUtility } from "@bin-exec-agent/utility/command-line-utility";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import { spawnParametersLeaflet } from "@testdata";
import { ChildProcess } from "child_process";
import process from "node:process";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";

describe("Unit tests for ProcessHandler", () => {

    let childProcessMock: SinonStubbedInstance<ChildProcess>;
    let killStub: SinonStub;
    let pidFileHandlerMock: SinonStubbedInstance<PIDFileHandler>;
    let commandLineUtilityMock: SinonStubbedInstance<CommandLineUtility>;
    let processHandler: ProcessHandler;

    beforeAll(() => {
        killStub = sinon.stub(process, "kill");
    });

    beforeEach(() => {
        childProcessMock = sinon.createStubInstance(ChildProcess);
        killStub.reset();
        pidFileHandlerMock = sinon.createStubInstance(PIDFileHandler);
        commandLineUtilityMock = sinon.createStubInstance(CommandLineUtility);

        processHandler = new ProcessHandler(pidFileHandlerMock, commandLineUtilityMock);
    });

    afterAll(() => {
        killStub.restore();
    });

    describe("Test scenarios for #spawn", () => {

        it("should successfully spawn process", async () => {

            // given
            const expectedPID = 250;

            commandLineUtilityMock.spawn.withArgs(spawnParametersLeaflet.executablePath, spawnParametersLeaflet.arguments, {
                uid: spawnParametersLeaflet.userID,
                cwd: spawnParametersLeaflet.workDirectory,
                detached: true,
                stdio: "ignore"
            }).returns(childProcessMock);
            childProcessMock.on.returns(childProcessMock);
            Object.defineProperty(childProcessMock, "pid", { value: expectedPID });

            // when
            const resultPromise = processHandler.spawn(spawnParametersLeaflet);

            // then
            childProcessMock.on.withArgs("spawn").callArg(1);
            const result = await resultPromise;

            expect(result).toBe(expectedPID);
            // @ts-ignore
            expect(processHandler.trackedProcesses.get(spawnParametersLeaflet)).toBe(childProcessMock);

            sinon.assert.calledWith(pidFileHandlerMock.createPIDFile, spawnParametersLeaflet.workDirectory, expectedPID);
            sinon.assert.called(childProcessMock.unref);
        });

        it("should reject promise on spawn error", async () => {

            // given
            commandLineUtilityMock.spawn.returns(childProcessMock);
            childProcessMock.on.returns(childProcessMock);

            // when
            const resultPromise = processHandler.spawn(spawnParametersLeaflet);

            // then
            // @ts-ignore
            childProcessMock.on.withArgs("error").callArgWith(1, new Error("Something went wrong"));
            const failingCall = () => resultPromise;

            await expect(failingCall).rejects.toThrowError("Something went wrong");
            // @ts-ignore
            expect(processHandler.trackedProcesses.get(spawnParametersLeaflet)).toBeUndefined();

            sinon.assert.notCalled(pidFileHandlerMock.createPIDFile);
            sinon.assert.notCalled(childProcessMock.unref);
        });
    });

    describe("Test scenarios for #kill", () => {

        it("should return STOPPED status after killing running process by tracked process", () => {

            // given
            const pid = 251;

            Object.defineProperty(childProcessMock, "pid", { value: pid });
            // @ts-ignore
            processHandler.trackedProcesses.set(spawnParametersLeaflet, childProcessMock);

            // when
            const result = processHandler.kill(spawnParametersLeaflet);

            // then
            expect(result).toBe(DeploymentStatus.STOPPED);

            sinon.assert.notCalled(pidFileHandlerMock.readPID);
            sinon.assert.calledWith(killStub, -pid);
        });

        it("should return STOPPED status after killing running process by PID file", () => {

            // given
            const pid = 252;

            pidFileHandlerMock.readPID.withArgs(spawnParametersLeaflet.workDirectory).returns(pid);

            // when
            const result = processHandler.kill(spawnParametersLeaflet);

            // then
            expect(result).toBe(DeploymentStatus.STOPPED);

            sinon.assert.called(pidFileHandlerMock.readPID);
            sinon.assert.calledWith(killStub, -pid);
        });

        it("should return UNKNOWN_STOPPED status if PID could not be resolved", () => {

            // when
            const result = processHandler.kill(spawnParametersLeaflet);

            // then
            expect(result).toBe(DeploymentStatus.UNKNOWN_STOPPED);

            sinon.assert.called(pidFileHandlerMock.readPID);
            sinon.assert.notCalled(killStub);
        });

        it("should return STOP_FAILURE status if process.kill call fails", () => {

            // given
            const pid = 253;

            pidFileHandlerMock.readPID.withArgs(spawnParametersLeaflet.workDirectory).returns(pid);
            killStub.withArgs(-pid).throws(new Error("Something went wrong"));

            // when
            const result = processHandler.kill(spawnParametersLeaflet);

            // then
            expect(result).toBe(DeploymentStatus.STOP_FAILURE);

            sinon.assert.called(pidFileHandlerMock.readPID);
            sinon.assert.calledWith(killStub, -pid);
        });
    });
});
