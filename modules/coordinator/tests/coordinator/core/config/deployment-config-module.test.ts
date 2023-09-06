import { deploymentConfigModule, DeploymentRegistry } from "@coordinator/core/config/deployment-config-module";
import { UnknownDeploymentError } from "@coordinator/core/error/error-types";
import { Deployment } from "@core-lib/platform/api/deployment";
import {
    dockerAllArgsDeployment,
    dockerCustomDeployment,
    dockerNoArgsDeployment, filesystemExecutableDeployment, filesystemRuntimeDeployment,
    filesystemServiceDeployment
} from "@testdata/deployment";

describe("Unit tests for DeploymentConfigModule", () => {

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the processed configuration as a DeploymentRegistry instance", () => {

            // when
            const result = deploymentConfigModule.getConfiguration();

            // then
            expect(result).toBeDefined();
            expect(result).toBeInstanceOf(DeploymentRegistry);
        });
    });

    describe("Test scenarios for #getDeployment", () => {

        type Scenario = {
            name: string,
            expected: Deployment
        }

        const deployments: Scenario[] = [
            { name: "docker-no-args", expected: dockerNoArgsDeployment },
            { name: "docker-all-args", expected: dockerAllArgsDeployment },
            { name: "docker-custom", expected: dockerCustomDeployment },
            { name: "fs-service", expected: filesystemServiceDeployment },
            { name: "fs-executable", expected: filesystemExecutableDeployment },
            { name: "fs-runtime", expected: filesystemRuntimeDeployment }
        ];

        deployments.forEach(scenario => {
            it(`should return the requested deployment=${scenario.name} via the DeploymentRegistry`, () => {

                // given
                const deploymentRegistry = deploymentConfigModule.getConfiguration();

                // when
                const result = deploymentRegistry.getDeployment(scenario.name);

                // then
                expect(result).toBeDefined();
                expect(result).toStrictEqual(scenario.expected);
            });
        })

        it("should throw error if an unregistered deployment is requested", () => {

            // given
            const deploymentRegistry = deploymentConfigModule.getConfiguration();

            // when
            const failingCall = () => deploymentRegistry.getDeployment("unknown");

            // then
            // error expected
            expect(failingCall).toThrow(UnknownDeploymentError);
        });
    });
});
