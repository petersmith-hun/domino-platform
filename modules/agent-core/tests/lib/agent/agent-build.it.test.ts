import { AgentBuilder } from "@core-lib/agent/agent-builder";
import { initServer } from "@mockserver";
import { DummyLifecycleOperation } from "@testdata";
import DoneCallback = jest.DoneCallback;

describe("Integration tests for AgentBuilder", () => {

    describe("Test scenarios for #run", () => {

        it("should the agent start and wait for messages", (done: DoneCallback) => {

            // given
            initServer(done);

            const agentBuilder = AgentBuilder.lifecycleOperation(new DummyLifecycleOperation());

            // when
            agentBuilder.run();

            // then
            // expectations are located in mockserver
        }, 20000);
    });
});
