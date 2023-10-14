import { TaskContext, TaskResult, TaskStatus } from "@core-lib/agent/service/task";
import { DockerEngineApiClient } from "@docker-agent/service/docker/client/docker-engine-api-client";
import { DockerIdentificationTask } from "@docker-agent/task/docker-identification-task";
import { dockerIdentifyRequest, dockerVersionResponseContext } from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DockerIdentificationTask", () => {

    let dockerEngineApiClientMock: SinonStubbedInstance<DockerEngineApiClient>;
    let dockerIdentificationTask: DockerIdentificationTask;

    beforeEach(() => {
        dockerEngineApiClientMock = sinon.createStubInstance(DockerEngineApiClient);

        dockerIdentificationTask = new DockerIdentificationTask(dockerEngineApiClientMock);
    });

    describe("Test scenarios for #run", () => {

        it("should successfully identify Docker and resolve with DONE status", async () => {

            // given
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerIdentifyRequest).resolves(dockerVersionResponseContext);

            // when
            const result = await dockerIdentificationTask.run({} as TaskContext);

            // then
            expect(dockerEngineApiClientMock.identifiedDockerVersion).toBe(dockerVersionResponseContext.data!.Version);
            expect(result).toStrictEqual({
                status: TaskStatus.DONE
            } as TaskResult);
        });

        it("should identification fail on error and resolve with FAILED status", async () => {

            // given
            dockerEngineApiClientMock.executeDockerCommand.withArgs(dockerIdentifyRequest).rejects(new Error("Something went wrong"));

            // when
            const result = await dockerIdentificationTask.run({} as TaskContext);

            // then
            expect(dockerEngineApiClientMock.identifiedDockerVersion).toBe("Unidentified");
            expect(result).toStrictEqual({
                status: TaskStatus.FAILED
            } as TaskResult);
        });
    });
});
