import { DockerConnectionType, dockerEngineConfigModule } from "@docker-agent/config/docker-engine-config-module";

describe("Unit tests for DockerEngineConfigModule", () => {

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the configuration defined in test.yml", () => {

            // when
            const result = dockerEngineConfigModule.getConfiguration();

            // then
            expect(result.connection.connectionType).toBe(DockerConnectionType.SOCKET);
            expect(result.connection.uri).toBe("/path/to/docker.sock");
            expect(result.servers.length).toBe(1);
            expect(result.servers[0].host).toBe("example.dev.local");
            expect(result.servers[0].username).toBe("example-user");
            expect(result.servers[0].password).toBe("example-password");
        });
    });
});
