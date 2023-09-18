import { TaskContext, TaskStatus } from "@core-lib/agent/service/task";
import { SocketConnectionTask } from "@core-lib/agent/service/task/socket-connection-task";
import { agentConfig, wait } from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests for SocketConnectionTask", () => {

    let originalCreateSocket: Function;
    let socketMock: SinonStubbedInstance<WebSocket>;
    let socketConnectionTask: SocketConnectionTask;

    beforeAll(() => {
        // @ts-ignore
        originalCreateSocket = SocketConnectionTask.prototype.createSocket
        // @ts-ignore
        SocketConnectionTask.prototype.createSocket = function (context: TaskContext) {
            context.socket = socketMock;
        }
    });

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        socketConnectionTask = new SocketConnectionTask();
    });

    afterAll(() => {
        // @ts-ignore
        SocketConnectionTask.prototype.createSocket = originalCreateSocket;
    });

    describe("Test scenarios for #run", () => {

        it("should attach listeners then return with DONE status if connection is successfully established", async () => {

            // given
            const context = {
                config: agentConfig,
                authorization: new Map<string, string>()
            } as TaskContext;

            // when
            const resultPromise = socketConnectionTask.run(context);
            await wait(100);
            socketMock.on.getCalls()[2].callArg(1);
            const result = await resultPromise;

            // then
            expect(result).toStrictEqual({ status: TaskStatus.DONE });
        });

        it("should attach listeners then return with FAILED status if connection could not be established", async () => {

            // given
            const context = {
                config: agentConfig,
                authorization: new Map<string, string>()
            } as TaskContext;

            // when
            const resultPromise = socketConnectionTask.run(context);
            await wait(100);
            socketMock.on.getCalls()[0].callArgWith(1, new Error("Something went wrong"));
            const result = await resultPromise;

            // then
            expect(result).toStrictEqual({ status: TaskStatus.FAILED });
        });

        it("should attached on-close listener clear keep-alive interval", async () => {

            // given
            const context = {
                config: agentConfig,
                authorization: new Map<string, string>(),
                keepAliveInterval: setInterval(() => {}, 1000)
            } as TaskContext;
            // @ts-ignore
            expect(context.keepAliveInterval!._destroyed).toBe(false);

            // when
            const resultPromise = socketConnectionTask.run(context);
            await wait(100);
            socketMock.on.getCalls()[1].callArg(1);
            socketMock.on.getCalls()[2].callArg(1);
            await resultPromise;

            // then
            // @ts-ignore
            expect(context.keepAliveInterval!._destroyed).toBe(true);
        });
    });
});
