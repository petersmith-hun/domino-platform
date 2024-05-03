import { DeploymentSourceHandler } from "@bin-exec-agent/service/execution/handler/deployment-source-handler";
import { deploymentBinaryReferenceExactVersion, deploymentBinaryReferenceInvalidSourcePath } from "@testdata";
import axios from "axios";
import fs from "node:fs";
import { IncomingMessage } from "node:http";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentSourceHandler", () => {

    let axiosGetStub: SinonStub;
    let createWriteStreamStub: SinonStub;
    let incomingMessageStub: SinonStubbedInstance<IncomingMessage>;

    let deploymentSourceHandler: DeploymentSourceHandler;

    beforeAll(() => {
        axiosGetStub = sinon.stub(axios, "get");
        createWriteStreamStub = sinon.stub(fs, "createWriteStream");
    });

    beforeEach(() => {
        axiosGetStub.reset();
        createWriteStreamStub.reset();
        incomingMessageStub = sinon.createStubInstance(IncomingMessage);

        deploymentSourceHandler = new DeploymentSourceHandler();
    });

    afterAll(() => {
        axiosGetStub.restore();
        createWriteStreamStub.restore();
    });

    describe("Test scenarios for #retrieveBinary", () => {

        it("should successfully retrieve binary", async () => {

            // given
            const writeStreamStub = new WriteStreamStub(true) as unknown as fs.WriteStream;
            axiosGetStub.withArgs(deploymentBinaryReferenceExactVersion.sourcePath).returns({
                status: 200,
                data: incomingMessageStub
            });
            createWriteStreamStub.withArgs(deploymentBinaryReferenceExactVersion.storePath).returns(writeStreamStub);
            incomingMessageStub.pipe.returns(writeStreamStub);

            // when
            const result = await deploymentSourceHandler.retrieveBinary(deploymentBinaryReferenceExactVersion);

            // then
            expect(result).toBe(true);
        });

        it("should return with false value on non-200 response", async () => {

            // given
            axiosGetStub.withArgs(deploymentBinaryReferenceExactVersion.sourcePath).returns({
                status: 404
            });

            // when
            const result = await deploymentSourceHandler.retrieveBinary(deploymentBinaryReferenceExactVersion);

            // then
            expect(result).toBe(false);
        });

        it("should return with false value on empty data stream", async () => {

            // given
            axiosGetStub.withArgs(deploymentBinaryReferenceExactVersion.sourcePath).returns({
                status: 200,
                data: null
            });

            // when
            const result = await deploymentSourceHandler.retrieveBinary(deploymentBinaryReferenceExactVersion);

            // then
            expect(result).toBe(false);
        });

        it("should return with false value if saving the binary fails", async () => {

            // given
            const writeStreamStub = new WriteStreamStub(false) as unknown as fs.WriteStream;
            axiosGetStub.withArgs(deploymentBinaryReferenceExactVersion.sourcePath).returns({
                status: 200,
                data: incomingMessageStub
            });
            createWriteStreamStub.withArgs(deploymentBinaryReferenceExactVersion.storePath).returns(writeStreamStub);
            incomingMessageStub.pipe.returns(writeStreamStub);

            // when
            const result = await deploymentSourceHandler.retrieveBinary(deploymentBinaryReferenceExactVersion);

            // then
            expect(result).toBe(false);
        });

        it("should throw error for unsupported source", async () => {

            // when
            const failingCall = () => deploymentSourceHandler.retrieveBinary(deploymentBinaryReferenceInvalidSourcePath);

            // then
            await expect(failingCall).rejects.toThrowError("Source path must be a valid remote URL");
        });
    });
});

class WriteStreamStub {

    private readonly successful: boolean;

    constructor(successful: boolean) {
        this.successful = successful;
    }

    on(event: string, listener: (error?: any) => {}): WriteStreamStub {

        if (event === "error" && !this.successful) {
            listener({ message: "Something went wrong" });
        } else if (event !== "error") {
            listener();
        }

        return this;
    }
}
