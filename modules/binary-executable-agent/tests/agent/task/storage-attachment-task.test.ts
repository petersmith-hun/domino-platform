import { StorageAttachmentTask } from "@bin-exec-agent/task/storage-attachment-task";
import { StorageUtility } from "@bin-exec-agent/utility/storage-utility";
import { TaskStatus } from "@core-lib/agent/service/task";
import { unusedTaskContext } from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for StorageAttachmentTask", () => {

    let storageUtilityMock: SinonStubbedInstance<StorageUtility>;
    let storageAttachmentTask: StorageAttachmentTask;

    beforeEach(() => {
        storageUtilityMock = sinon.createStubInstance(StorageUtility);

        storageAttachmentTask = new StorageAttachmentTask(storageUtilityMock);
    });

    describe("Test scenarios for #run", () => {

        it("should return with DONE status on successfully attaching storage paths", async () => {

            // when
            const result = await storageAttachmentTask.run(unusedTaskContext);

            // then
            expect(result.status).toBe(TaskStatus.DONE);

            sinon.assert.called(storageUtilityMock.createStorage);
            sinon.assert.called(storageUtilityMock.ensureStorageAccess);
        });

        it("should return with FAILED status if storage creation fails", async () => {

            // given
            storageUtilityMock.createStorage.throws(new Error("Something went wrong"));

            // when
            const result = await storageAttachmentTask.run(unusedTaskContext);

            // then
            expect(result.status).toBe(TaskStatus.FAILED);

            sinon.assert.called(storageUtilityMock.createStorage);
            sinon.assert.notCalled(storageUtilityMock.ensureStorageAccess);
        });

        it("should return with FAILED status if ensuring access fails", async () => {

            // given
            storageUtilityMock.ensureStorageAccess.throws(new Error("Something went wrong"));

            // when
            const result = await storageAttachmentTask.run(unusedTaskContext);

            // then
            expect(result.status).toBe(TaskStatus.FAILED);

            sinon.assert.called(storageUtilityMock.createStorage);
            sinon.assert.called(storageUtilityMock.ensureStorageAccess);
        });
    });

    describe("Test scenarios for #taskName", () => {

        it("should always return 'Storage attachment'", () => {

            // when
            const result = storageAttachmentTask.taskName();

            // then
            expect(result).toBe("Storage attachment");
        });
    });
});
