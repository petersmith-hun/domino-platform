import { LifecycleService } from "@coordinator/core/service/lifecycle-service";
import { AgentRegistry, ConnectedAgent } from "@coordinator/core/service/registry/agent-registry";
import { LifecycleOperationRegistry } from "@coordinator/core/socket/lifecycle-operation-registry";
import { Deployment } from "@core-lib/platform/api/deployment";
import { DeploymentVersion, DeploymentVersionType } from "@core-lib/platform/api/lifecycle";
import { Lifecycle, LifecycleCommand, MessageType, SocketMessage } from "@core-lib/platform/api/socket";
import {
    agentLocalhostDocker,
    startFailureOperationResult,
    startOperationResult,
    stopOperationResult,
    versionedDeployOperationResult
} from "@testdata/core";
import { hrtime } from "process";
import sinon, { SinonStub, SinonStubbedInstance } from "sinon";
import { WebSocket } from "ws";

describe("Test scenarios for LifecycleService", () => {

    let hrTimeStub: SinonStub;
    let socketMock: SinonStubbedInstance<WebSocket>;
    let agentRegistryMock: SinonStubbedInstance<AgentRegistry>;
    let lifecycleOperationRegistryMock: SinonStubbedInstance<LifecycleOperationRegistry>;
    let agentStub: ConnectedAgent;
    let lifecycleService: LifecycleService;

    beforeAll(() => {
        hrTimeStub = sinon.stub(hrtime, "bigint");
    });

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        agentRegistryMock = sinon.createStubInstance(AgentRegistry);
        lifecycleOperationRegistryMock = sinon.createStubInstance(LifecycleOperationRegistry);
        agentStub = {
            socket: socketMock,
            ... agentLocalhostDocker
        }

        lifecycleService = new LifecycleService(agentRegistryMock, lifecycleOperationRegistryMock);
    });

    afterAll(() => {
        hrTimeStub.restore();
    });

    describe("Test scenarios for #deploy", () => {

        it("should generate and submit a deploy request with version", async () => {

            // given
            const deployment = prepareDeployment("app_versioned");
            const version = prepareDeploymentVersion("1.2.3");
            const messageID = `lifecycle/deploy/app_versioned/1.2.3/1234`;
            const expectedMessage = prepareExpectedMessage(messageID, LifecycleCommand.DEPLOY, deployment, version);

            agentRegistryMock.getFirstAvailable.withArgs(deployment).returns(agentStub);
            lifecycleOperationRegistryMock.operationStarted.withArgs(messageID).resolves(versionedDeployOperationResult);
            hrTimeStub.returns(BigInt(1234));

            // when
            const result = await lifecycleService.deploy(deployment, version);

            // then
            expect(result).toStrictEqual(versionedDeployOperationResult);
            sinon.assert.calledWith(socketMock.send, JSON.stringify(expectedMessage));
        });

        it("should generate and submit a deploy request without version", async () => {

            // given
            const deployment = prepareDeployment("app_non_versioned");
            const version = prepareDeploymentVersion();
            const messageID = `lifecycle/deploy/app_non_versioned/current/5678`;
            const expectedMessage = prepareExpectedMessage(messageID, LifecycleCommand.DEPLOY, deployment, version);

            agentRegistryMock.getFirstAvailable.withArgs(deployment).returns(agentStub);
            lifecycleOperationRegistryMock.operationStarted.withArgs(messageID).resolves(versionedDeployOperationResult);
            hrTimeStub.returns(BigInt(5678));

            // when
            const result = await lifecycleService.deploy(deployment, version);

            // then
            expect(result).toStrictEqual(versionedDeployOperationResult);
            sinon.assert.calledWith(socketMock.send, JSON.stringify(expectedMessage));
        });

        function prepareDeploymentVersion(version?: string): DeploymentVersion {

            return {
                version: version,
                versionType: version
                    ? DeploymentVersionType.EXACT
                    : DeploymentVersionType.LATEST
            }
        }
    });


    describe("Test scenarios for #start", () => {

        it("should generate and submit a start request", async () => {

            // given
            const deployment = prepareDeployment("app_started");
            const messageID = `lifecycle/start/app_started/current/1111`;
            const expectedMessage = prepareExpectedMessage(messageID, LifecycleCommand.START, deployment);

            agentRegistryMock.getFirstAvailable.withArgs(deployment).returns(agentStub);
            lifecycleOperationRegistryMock.operationStarted.withArgs(messageID).resolves(startOperationResult);
            hrTimeStub.returns(BigInt(1111));

            // when
            const result = await lifecycleService.start(deployment);

            // then
            expect(result).toStrictEqual(startOperationResult);
            sinon.assert.calledWith(socketMock.send, JSON.stringify(expectedMessage));
        });
    });

    describe("Test scenarios for #stop", () => {

        it("should generate and submit a stop request", async () => {

            // given
            const deployment = prepareDeployment("app_stopped");
            const messageID = `lifecycle/stop/app_stopped/current/2222`;
            const expectedMessage = prepareExpectedMessage(messageID, LifecycleCommand.STOP, deployment);

            agentRegistryMock.getFirstAvailable.withArgs(deployment).returns(agentStub);
            lifecycleOperationRegistryMock.operationStarted.withArgs(messageID).resolves(stopOperationResult);
            hrTimeStub.returns(BigInt(2222));

            // when
            const result = await lifecycleService.stop(deployment);

            // then
            expect(result).toStrictEqual(stopOperationResult);
            sinon.assert.calledWith(socketMock.send, JSON.stringify(expectedMessage));
        });
    });

    describe("Test scenarios for #restart", () => {

        it("should generate and submit a restart request", async () => {

            // given
            const deployment = prepareDeployment("app_restarted");
            const messageID = `lifecycle/restart/app_restarted/current/3333`;
            const expectedMessage = prepareExpectedMessage(messageID, LifecycleCommand.RESTART, deployment);

            agentRegistryMock.getFirstAvailable.withArgs(deployment).returns(agentStub);
            lifecycleOperationRegistryMock.operationStarted.withArgs(messageID).resolves(startFailureOperationResult);
            hrTimeStub.returns(BigInt(3333));

            // when
            const result = await lifecycleService.restart(deployment);

            // then
            expect(result).toStrictEqual(startFailureOperationResult);
            sinon.assert.calledWith(socketMock.send, JSON.stringify(expectedMessage));
        });
    });

    function prepareDeployment(id: string): Deployment {

        return {
            id: id
        } as Deployment;
    }

    function prepareExpectedMessage(messageID: string, command: LifecycleCommand, deployment: Deployment, version?: DeploymentVersion): SocketMessage<Lifecycle> {

        return {
            messageID: messageID,
            messageType: MessageType.LIFECYCLE,
            payload: {
                deployment: deployment,
                version: version,
                command: command
            }
        }
    }
});
