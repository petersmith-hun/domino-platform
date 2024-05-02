import { PlatformCompatibilityCheckTask } from "@bin-exec-agent/task/platform-compatibility-check-task";
import { TaskStatus } from "@core-lib/agent/service/task";
import { unusedTaskContext } from "@testdata";

describe("Unit tests for PlatformCompatibilityCheckTask", () => {

    let platformCompatibilityCheckTask: PlatformCompatibilityCheckTask;

    describe("Test scenarios for #run", () => {

        it("should complete with DONE status on compatible OS", async () => {

            // given
            platformCompatibilityCheckTask = new PlatformCompatibilityCheckTask("linux");

            // when
            const result = await platformCompatibilityCheckTask.run(unusedTaskContext);

            // then
            expect(result.status).toBe(TaskStatus.DONE);
        });

        it("should complete with FAILED status on incompatible OS", async () => {

            // given
            platformCompatibilityCheckTask = new PlatformCompatibilityCheckTask("win32");

            // when
            const result = await platformCompatibilityCheckTask.run(unusedTaskContext);

            // then
            expect(result.status).toBe(TaskStatus.FAILED);
        });
    });

    describe("Test scenarios for #taskName", () => {

        it("should always return 'Platform compatibility check'", () => {

            // given
            platformCompatibilityCheckTask = new PlatformCompatibilityCheckTask("linux");

            // when
            const result = platformCompatibilityCheckTask.taskName();

            // then
            expect(result).toBe("Platform compatibility check");
        });
    });
});
