import { PIDFileHandler } from "@bin-exec-agent/service/execution/handler/pid-file-handler";
import fs from "node:fs";
import sinon, { SinonStub } from "sinon";

const workDirectory = "/workdir";
const pidFilePath = "/workdir/.pid";

describe("Unit tests for PIDFileHandler", () => {

    let writeFileSyncStub: SinonStub;
    let readFileSyncStub: SinonStub;
    let existsSyncStub: SinonStub;
    let rmSyncStub: SinonStub;
    let pidFileHandler: PIDFileHandler;

    beforeAll(() => {
        writeFileSyncStub = sinon.stub(fs, "writeFileSync");
        readFileSyncStub = sinon.stub(fs, "readFileSync");
        existsSyncStub = sinon.stub(fs, "existsSync");
        rmSyncStub = sinon.stub(fs, "rmSync");
    });

    beforeEach(() => {
        writeFileSyncStub.reset();
        readFileSyncStub.reset();
        existsSyncStub.reset();
        rmSyncStub.reset();

        pidFileHandler = new PIDFileHandler();
    });

    afterAll(() => {
        writeFileSyncStub.restore();
        readFileSyncStub.restore();
        existsSyncStub.restore();
        rmSyncStub.restore();
    });

    describe("Test scenarios for #createPIDFile", () => {

        it("should create PID file", () => {

            // when
            pidFileHandler.createPIDFile(workDirectory, 250);

            // then
            sinon.assert.calledWith(writeFileSyncStub, pidFilePath, "250");
        });

        it("should skip creating PID file for undefined PID", () => {

            // when
            pidFileHandler.createPIDFile(workDirectory);

            // then
            sinon.assert.notCalled(writeFileSyncStub);
        });
    });

    describe("Test scenarios for #readPID", () => {

        it("should successfully read content of PID file", () => {

            // given
            existsSyncStub.withArgs(pidFilePath).returns(true);
            readFileSyncStub.withArgs(pidFilePath).returns(Buffer.from("250"));

            // when
            const result = pidFileHandler.readPID(workDirectory);

            // then
            expect(result).toBe(250);
        });

        it("should return undefined on missing PID file", () => {

            // given
            existsSyncStub.withArgs(pidFilePath).returns(false);

            // when
            const result = pidFileHandler.readPID(workDirectory);

            // then
            expect(result).toBeUndefined();
        });
    });

    describe("Test scenarios for #deletePIDFile", () => {

        it("should try to remove PID file", () => {

            // when
            pidFileHandler.deletePIDFile(workDirectory);

            // then
            sinon.assert.calledWith(rmSyncStub, pidFilePath);
        });
    });
});
