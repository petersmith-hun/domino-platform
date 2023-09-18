import { TaskContext, TaskStatus } from "@core-lib/agent/service/task";
import { AuthenticationTask } from "@core-lib/agent/service/task/authentication-task";
import { agentConfig, agentID, apiKey } from "@testdata";

describe("Unit tests for AuthenticationTask", () => {

    let authenticationTask: AuthenticationTask;

    beforeEach(() => {
        authenticationTask = new AuthenticationTask();
    });

    describe("Test scenarios for #run", () => {

        it("should fill in authorization data in context and return with DONE status", async () => {

            // given
            const context = {
                agentID: agentID,
                config: agentConfig
            } as TaskContext;

            // when
            const result = await authenticationTask.run(context);

            // then
            expect(result).toStrictEqual({ status: TaskStatus.DONE });
            expect(context.authorization).toStrictEqual(new Map([
                ["X-Api-Key", apiKey],
                ["X-Agent-ID", agentID]
            ]))
        });
    });
});
