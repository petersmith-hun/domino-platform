import { AgentConfig } from "@coordinator/core/config/agent-config-module";
import { LifecycleOperationRegistry } from "@coordinator/core/socket/lifecycle-operation-registry";
import { DeploymentStatus } from "@core-lib/platform/api/lifecycle";
import { Failure } from "@core-lib/platform/api/socket";
import LoggerFactory from "@core-lib/platform/logging";
import { startOperationResult } from "@testdata/core";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";

describe("Unit tests for LifecycleOperationRegistry", () => {

    let loggerFactoryStub: SinonStub;
    let loggerStub: SinonStubbedInstance<LoggerStub>;
    let lifecycleOperationRegistry: LifecycleOperationRegistry;

    beforeAll(() => {
        loggerFactoryStub = sinon.stub(LoggerFactory, "getLogger");
    })

    beforeEach(() => {
        loggerStub = sinon.createStubInstance(LoggerStub);
        loggerFactoryStub.returns(loggerStub);
        lifecycleOperationRegistry = new LifecycleOperationRegistry({
            operationTimeout: 1000
        } as AgentConfig);
    });

    afterAll(() => {
        loggerFactoryStub.restore();
    });

    describe("Test scenarios for #operationStarted and #operationFinished", () => {

        it("should register a tracked command and finish it in time", async () => {

            // given
            const messageID = "message-1";
            const trackedCommand = lifecycleOperationRegistry.operationStarted(messageID);
            await wait(200);
            lifecycleOperationRegistry.operationFinished(messageID, startOperationResult);

            // when
            const result = await trackedCommand;

            // then
            expect(result).toStrictEqual(startOperationResult);
        });

        it("should not be able to finish a tracked command twice", async () => {

            // given
            const messageID = "message-1-2";
            const trackedCommand = lifecycleOperationRegistry.operationStarted(messageID);
            await wait(300);
            lifecycleOperationRegistry.operationFinished(messageID, startOperationResult);
            await wait(50);
            lifecycleOperationRegistry.operationFinished(messageID, startOperationResult);

            // when
            const result = await trackedCommand;

            // then
            expect(result).toStrictEqual(startOperationResult);
            sinon.assert.calledWith(loggerStub.warn, "Unknown message [message-1-2]");
        });

        it("should log that the requested command does not exist", () => {

            // when
            lifecycleOperationRegistry.operationFinished("unknown-message", startOperationResult);

            // then
            sinon.assert.calledWith(loggerStub.warn, "Unknown message [unknown-message]");
        });

        it("should timeout and then destroy its own entry", async () => {

            // given
            const messageID = "message-timeout";
            const trackedCommand = lifecycleOperationRegistry.operationStarted(messageID);

            // when
            const result = await trackedCommand;
            lifecycleOperationRegistry.operationFinished(messageID, startOperationResult);

            // then
            sinon.assert.calledWith(loggerStub.error, "Active lifecycle operation [message-timeout] timed out after [1s]");
            sinon.assert.calledWith(loggerStub.warn, "Unknown message [message-timeout]");
            expect(result).toStrictEqual({
                deployOperation: false,
                status: DeploymentStatus.TIMEOUT
            });
        }, 1500);
    });

    describe("Test scenarios for #operationStarted and #operationFailed", () => {

        const failure: Failure = {
            message: "Something went wrong"
        }

        it("should register a tracked command and fail it in time", async () => {

            // given
            const messageID = "message-2";
            const trackedCommand = lifecycleOperationRegistry.operationStarted(messageID);
            await wait(500);
            lifecycleOperationRegistry.operationFailed(messageID, failure);

            // when
            const rejection = () => trackedCommand;

            // then
            await expect(rejection).rejects.toThrow(failure.message);
        });

        it("should log that the requested command does not exist", () => {

            // when
            lifecycleOperationRegistry.operationFailed("unknown-message", failure);

            // then
            sinon.assert.calledWith(loggerStub.warn, "Unknown message [unknown-message]");
        });
    });
});

const wait = (timeout: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

class LoggerStub {
    warn(message: string): void {};
    error(message: string): void {};
}
