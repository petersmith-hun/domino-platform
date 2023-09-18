import { AgentStatus, TaskContext, TaskStatus } from "@core-lib/agent/service/task";
import { AnnouncementTask } from "@core-lib/agent/service/task/announcement-task";
import { Announcement, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import { agentConfig, agentID, wait } from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Unit tests for AnnouncementTask", () => {

    let socketMock: SinonStubbedInstance<WebSocket>;
    let announcementTask: AnnouncementTask;

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        announcementTask = new AnnouncementTask();
    });

    describe("Test scenarios for #run", () => {

        it("should return with DONE status on successful announcement", async () => {

            // given
            const context = {
                socket: socketMock,
                agentStatus: AgentStatus.INITIALIZING,
                config: agentConfig,
                agentID: agentID
            } as unknown as TaskContext;

            const expectedSocketMessage = JSON.stringify({
                messageID: `announce:${agentID}`,
                messageType: MessageType.ANNOUNCEMENT,
                payload: agentConfig.identification
            } as SocketMessage<Announcement>);

            // when
            const resultPromise = announcementTask.run(context);
            await wait(50);
            socketMock.send.callArg(1);
            const result = await resultPromise;

            // then
            expect(result).toStrictEqual({ status: TaskStatus.DONE });
            sinon.assert.calledWith(socketMock.send, expectedSocketMessage);
        });

        it("should return with FAILED status on failed announcement", async () => {

            // given
            const context = {
                socket: socketMock,
                agentStatus: AgentStatus.INITIALIZING,
                config: agentConfig,
                agentID: agentID
            } as unknown as TaskContext;

            // when
            const resultPromise = announcementTask.run(context);
            await wait(50);
            socketMock.send.callArgWith(1, new Error("Something went wrong"));
            const result = await resultPromise;

            // then
            expect(result).toStrictEqual({ status: TaskStatus.FAILED });
        });
    });
});
