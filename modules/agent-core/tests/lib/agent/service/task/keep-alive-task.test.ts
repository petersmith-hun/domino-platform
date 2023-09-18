import { TaskContext, TaskStatus } from "@core-lib/agent/service/task";
import { KeepAliveTask } from "@core-lib/agent/service/task/keep-alive-task";
import { MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import { wait } from "@testdata";
import process, { hrtime } from "process";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests for KeepAliveTask", () => {

    let hrTimeStub: SinonStub;
    let processExitStub: SinonStub;
    let socketMock: SinonStubbedInstance<WebSocket>;
    let keepAliveTask: KeepAliveTask;

    beforeAll(() => {
        hrTimeStub = sinon.stub(hrtime, "bigint");
        processExitStub = sinon.stub(process, "exit");
    });

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        keepAliveTask = new KeepAliveTask();
    });

    afterAll(() => {
        hrTimeStub.restore();
        processExitStub.restore();
    });

    describe("Test scenarios for #run", () => {

        it("should schedule keep-alive ping loop and return with SCHEDULED status", async () => {

            // given
            const context = {
                pingConfirmed: true,
                socket: socketMock,
                config: {
                    coordinator: {
                        pingInterval: 1000,
                        pongTimeout: 30
                    }
                }
            } as unknown as TaskContext;

            hrTimeStub
                .onFirstCall().returns(1000)
                .onSecondCall().returns(2000)
                .onThirdCall().returns(3000);

            // when
            const result = await keepAliveTask.run(context);

            // then
            expect(result).toStrictEqual({ status: TaskStatus.SCHEDULED });
            await wait(3500);
            clearInterval(context.keepAliveInterval);
            context.pingConfirmed = true;

            sinon.assert.calledThrice(socketMock.send);

            for (let index = 0; index < 3; index++) {
                const sendCall = socketMock.send.getCalls()[index];
                expect(sendCall.firstArg).toStrictEqual(createPingMessage((index + 1) * 1000));
                sendCall.callArg(1);
                await wait(50);
            }

        }, 5000);

        it("should stop the agent if keep-alive confirmation does not arrive in time", async () => {

            // given
            const context = {
                pingConfirmed: true,
                socket: socketMock,
                config: {
                    coordinator: {
                        pingInterval: 1000,
                        pongTimeout: 30
                    }
                }
            } as unknown as TaskContext;

            hrTimeStub.returns(1000);

            // when
            const result = await keepAliveTask.run(context);

            // then
            expect(result).toStrictEqual({ status: TaskStatus.SCHEDULED });
            await wait(1500);
            clearInterval(context.keepAliveInterval);
            sinon.assert.calledOnce(socketMock.send);

            socketMock.send.callArg(1);
            await wait(50);
            sinon.assert.calledWith(processExitStub, 1);

        }, 2000);
    });

    function createPingMessage(time: number): string {

        return JSON.stringify({
            messageID: `ping:${time}`,
            messageType: MessageType.PING,
            payload: undefined
        } as SocketMessage<undefined>);
    }
});
