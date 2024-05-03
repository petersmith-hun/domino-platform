import { Registry } from "@bin-exec-agent/registry";
import { ExecutorUserRegistry } from "@bin-exec-agent/registry/executor-user-registry";
import { RuntimeRegistry } from "@bin-exec-agent/registry/runtime-registry";
import { ServiceAdapterRegistry } from "@bin-exec-agent/registry/service-adapter-registry";
import { RegistryInitializationTask } from "@bin-exec-agent/task/registry-initialization-task";
import { TaskStatus } from "@core-lib/agent/service/task";
import { unusedTaskContext } from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for RegistryInitializationTask", () => {

    let registryMock1: SinonStubbedInstance<Registry>;
    let registryMock2: SinonStubbedInstance<Registry>;
    let registryMock3: SinonStubbedInstance<Registry>;
    let registryInitializationTask: RegistryInitializationTask;

    beforeEach(() => {
        registryMock1 = sinon.createStubInstance(ExecutorUserRegistry);
        registryMock2 = sinon.createStubInstance(RuntimeRegistry);
        registryMock3 = sinon.createStubInstance(ServiceAdapterRegistry);

        registryInitializationTask = new RegistryInitializationTask([
            registryMock1,
            registryMock2,
            registryMock3
        ]);
    });

    describe("Test scenarios for #run", () => {

        it("should return with DONE status after successfully initializing all registry", async () => {

            // when
            const result = await registryInitializationTask.run(unusedTaskContext);

            // then
            expect(result.status).toBe(TaskStatus.DONE);
        });

        it("should return with FAILED status if any initialization fails", async () => {

            // given
            registryMock2.initialize.throws(new Error("Something went wrong"));

            // when
            const result = await registryInitializationTask.run(unusedTaskContext);

            // then
            expect(result.status).toBe(TaskStatus.FAILED);

            sinon.assert.called(registryMock1.initialize);
            sinon.assert.called(registryMock2.initialize);
            sinon.assert.notCalled(registryMock3.initialize);
        });
    });

    describe("Test scenarios for #taskName", () => {

        it("should always return 'Registry initialization'", () => {

            // when
            const result = registryInitializationTask.taskName();

            // then
            expect(result).toBe("Registry initialization");
        });
    });
});
