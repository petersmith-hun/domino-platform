import { CommandLineUtility } from "@bin-exec-agent/utility/command-line-utility";
import { SpawnOptions } from "child_process";
import child_process from "node:child_process";
import sinon, { SinonStub } from "sinon";

describe("Unit tests for CommandLineUtility", () => {

    let execSyncStub: SinonStub;
    let spawnStub: SinonStub;
    let commandLineUtility: CommandLineUtility;

    beforeAll(() => {
        execSyncStub = sinon.stub(child_process, "execSync");
        spawnStub = sinon.stub(child_process, "spawn");
    });

    beforeEach(() => {
        commandLineUtility = new CommandLineUtility();
    });

    afterAll(() => {
        execSyncStub.restore();
        spawnStub.restore();
    });

    describe("Test scenarios for #execute", () => {

        it("should pass call to child_process.execSync", () => {

            // given
            const command = "service domino start";
            const response = "executed";

            execSyncStub.withArgs(command, { stdio: "pipe" }).returns(Buffer.from(response));

            // when
            const result = commandLineUtility.execute(command);

            // then
            expect(result).toBe(response);
        });
    });

    describe("Test scenarios for #spawn", () => {

        it("should pass call to child_process.spawn", () => {

            // given
            const command = "service domino start";
            const args = ["arg1"];
            const options = {
                detached: true
            } as SpawnOptions;

            // when
            commandLineUtility.spawn(command, args, options);

            // then
            sinon.assert.calledWith(spawnStub, command, args, options);
        });
    });
});
