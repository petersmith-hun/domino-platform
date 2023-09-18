import { AgentCommonConfigModule } from "@core-lib/agent/config/agent-common-config-module";
import { AgentRunnerService } from "@core-lib/agent/service/agent-runner-service";
import { AgentStatus, Task, TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task";
import { agentConfig, agentID } from "@testdata";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";

describe("Unit tests for AgentRunnerService", () => {

    let processExitStub: SinonStub;
    let task1Mock: SinonStubbedInstance<Task>;
    let task2Mock: SinonStubbedInstance<Task>;
    let task3Mock: SinonStubbedInstance<Task>;
    let agentCommonConfigModuleMock: SinonStubbedInstance<AgentCommonConfigModule>;
    let agentRunnerService: AgentRunnerService;

    beforeAll(() => {
        processExitStub = sinon.stub(process, "exit");
    });

    beforeEach(() => {
        task1Mock = sinon.createStubInstance(TaskStub);
        task1Mock.taskName.returns("Task 1");
        task1Mock.run.resolves({ status: TaskStatus.DONE });
        task2Mock = sinon.createStubInstance(TaskStub);
        task2Mock.taskName.returns("Task 2");
        task3Mock = sinon.createStubInstance(TaskStub);
        task3Mock.taskName.returns("Task 3");
        task3Mock.run.resolves({ status: TaskStatus.RUNNING });

        agentCommonConfigModuleMock = sinon.createStubInstance(AgentCommonConfigModule);
        agentCommonConfigModuleMock.getConfiguration.returns(agentConfig);

        agentRunnerService = new AgentRunnerService(agentCommonConfigModuleMock, [
            task1Mock,
            task2Mock,
            task3Mock
        ]);
    });

    afterAll(() => {
        processExitStub.restore();
    });

    describe("Test scenarios for #startAgent", () => {

        it("should initialize context and run the registered tasks", async () => {

            // given
            const expectedContext = {
                agentID: agentID,
                config: agentConfig,
                agentStatus: AgentStatus.INITIALIZING
            } as TaskContext;

            task2Mock.run.resolves({ status: TaskStatus.SCHEDULED });

            // when
            await agentRunnerService.startAgent();

            // then
            sinon.assert.calledWith(task1Mock.run, expectedContext);
            sinon.assert.calledWith(task2Mock.run, expectedContext);
            sinon.assert.calledWith(task3Mock.run, expectedContext);
        });

        it("should stop the agent if a task fails", async () => {

            // given
            task2Mock.run.resolves({ status: TaskStatus.FAILED });

            // when
            await agentRunnerService.startAgent();

            // then
            sinon.assert.calledWith(processExitStub, 1);
        });
    });
});

class TaskStub implements Task {

    run(context: TaskContext): Promise<TaskResult> {
        return Promise.resolve({ status: TaskStatus.DONE });
    }

    taskName(): string {
        return "";
    }
}
