import { SecretDAO } from "@coordinator/core/dao/secret-dao";
import { Secret } from "@coordinator/core/domain/storage";
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
    let secretDAOMock: SinonStubbedInstance<SecretDAO>;
    let agentStub: ConnectedAgent;
    let lifecycleService: LifecycleService;

    beforeAll(() => {
        hrTimeStub = sinon.stub(hrtime, "bigint");
    });

    beforeEach(() => {
        socketMock = sinon.createStubInstance(WebSocket);
        agentRegistryMock = sinon.createStubInstance(AgentRegistry);
        lifecycleOperationRegistryMock = sinon.createStubInstance(LifecycleOperationRegistry);
        secretDAOMock = sinon.createStubInstance(SecretDAO);
        agentStub = {
            socket: socketMock,
            ... agentLocalhostDocker
        }

        lifecycleService = new LifecycleService(agentRegistryMock, lifecycleOperationRegistryMock, secretDAOMock);
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

            secretDAOMock.findAll.resolves([
                prepareSecret("volume.logs", "/var/logs"),
                prepareSecret("secret.path", "secret-sub-path"),
                prepareSecret("home.uri", "localhost:9999/apps"),
                prepareSecret("duplicate.secret", "/duplicate")
            ]);
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

            secretDAOMock.findAll.resolves([
                prepareSecret("volume.logs", "/var/logs"),
                prepareSecret("secret.path", "secret-sub-path"),
                prepareSecret("home.uri", "localhost:9999/apps"),
                prepareSecret("duplicate.secret", "/duplicate")
            ]);
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

            secretDAOMock.findAll.resolves([
                prepareSecret("volume.logs", "/var/logs"),
                prepareSecret("secret.path", "secret-sub-path"),
                prepareSecret("home.uri", "localhost:9999/apps"),
                prepareSecret("duplicate.secret", "/duplicate")
            ]);
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

            secretDAOMock.findAll.resolves([
                prepareSecret("volume.logs", "/var/logs"),
                prepareSecret("secret.path", "secret-sub-path"),
                prepareSecret("home.uri", "localhost:9999/apps"),
                prepareSecret("duplicate.secret", "/duplicate")
            ]);
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

            secretDAOMock.findAll.resolves([
                prepareSecret("volume.logs", "/var/logs"),
                prepareSecret("secret.path", "secret-sub-path"),
                prepareSecret("home.uri", "localhost:9999/apps"),
                prepareSecret("duplicate.secret", "/duplicate")
            ]);
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

    function prepareSecret(key: string, value: string): Secret {
        return { key, value } as Secret
    }

    function prepareDeployment(id: string): Deployment {

        return {
            id: id,
            source: {
                home: "[dsm:home.uri]"
            },
            execution: {
                args: {
                    volumes: {
                        "[dsm:volume.logs]": "/logs",
                        "/partial/[dsm:secret.path]/in/volume": "/volume2",
                        "[dsm:duplicate.secret]": "[dsm:duplicate.secret]"
                    }
                }
            }
        } as unknown as Deployment;
    }

    function prepareExpectedMessage(messageID: string, command: LifecycleCommand, deployment: Deployment, version?: DeploymentVersion): SocketMessage<Lifecycle> {

        const resolvedDeployment = {
            id: deployment.id,
            source: {
                home: "localhost:9999/apps"
            },
            execution: {
                args: {
                    volumes: {
                        "/var/logs": "/logs",
                        "/partial/secret-sub-path/in/volume": "/volume2",
                        "/duplicate": "/duplicate"
                    }
                }
            }
        } as unknown as Deployment

        return {
            messageID: messageID,
            messageType: MessageType.LIFECYCLE,
            payload: {
                deployment: resolvedDeployment,
                version: version,
                command: command
            }
        }
    }
});
