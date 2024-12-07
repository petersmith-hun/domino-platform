import { ImportedDeploymentConfigModule } from "@coordinator/core/config/deployment/imported-deployment-config-module";
import { InvalidImportedDeploymentError } from "@coordinator/core/error/error-types";
import { Deployment } from "@core-lib/platform/api/deployment";
import {
    dockerAllArgsDeployment,
    dockerAllArgsDeploymentYaml,
    dockerCustomDeployment,
    dockerCustomDeploymentYaml,
    dockerNoArgsDeployment,
    dockerNoArgsDeploymentYaml,
    filesystemExecutableDeployment,
    filesystemExecutableDeploymentYaml,
    filesystemRuntimeDeployment,
    filesystemRuntimeDeploymentYaml,
    filesystemServiceDeployment,
    filesystemServiceDeploymentYaml,
    invalidIDYaml,
    invalidTooDeepYaml, invalidYamlMalformed,
    invalidYamlMissingMandatoryParameter
} from "@testdata/deployment";

describe("Unit tests for ImportedDeploymentConfigModule", () => {

    describe("Test scenarios for #fromYAML", () => {

        type Scenario = {
            name: string,
            yaml: string,
            expected: Deployment
        }

        const deployments: Scenario[] = [
            { name: "docker-no-args", yaml: dockerNoArgsDeploymentYaml, expected: dockerNoArgsDeployment },
            { name: "docker-all-args", yaml: dockerAllArgsDeploymentYaml, expected: dockerAllArgsDeployment },
            { name: "docker-custom", yaml: dockerCustomDeploymentYaml, expected: dockerCustomDeployment },
            { name: "fs-service", yaml: filesystemServiceDeploymentYaml, expected: filesystemServiceDeployment },
            { name: "fs-executable", yaml: filesystemExecutableDeploymentYaml, expected: filesystemExecutableDeployment },
            { name: "fs-runtime", yaml: filesystemRuntimeDeploymentYaml, expected: filesystemRuntimeDeployment }
        ];

        deployments.forEach(scenario => {
            it(`should parse deployment=${scenario.name} from YAML (deployment definition import via API)`, () => {

                // when
                const result = ImportedDeploymentConfigModule.fromYAML(scenario.yaml);

                // then
                expect(result).toBeDefined();
                expect(JSON.stringify(result)).toEqual(JSON.stringify(scenario.expected));
            });
        })

        it("should throw error when ID is not matching expected pattern", () => {

            // when
            const failingCall = () => ImportedDeploymentConfigModule.fromYAML(invalidIDYaml);

            // then
            expect(failingCall).toThrow(InvalidImportedDeploymentError);
            expect(failingCall).toThrow("Imported definition ID=abc123 is invalid");
        });

        it("should throw error when YAML structure is too deep", () => {

            // when
            const failingCall = () => ImportedDeploymentConfigModule.fromYAML(invalidTooDeepYaml);

            // then
            expect(failingCall).toThrow(InvalidImportedDeploymentError);
            expect(failingCall).toThrow("Failed to parse definition by ID=app: Reached max depth of recursive enhancement, considering definition to be invalid");
        });

        it("should throw error when a mandatory parameter is missing from YAML", () => {

            // when
            const failingCall = () => ImportedDeploymentConfigModule.fromYAML(invalidYamlMissingMandatoryParameter);

            // then
            expect(failingCall).toThrow(InvalidImportedDeploymentError);
            expect(failingCall).toThrow("Failed to parse definition by ID=app: Failed to process application configuration: Missing mandatory configuration parameter 'home'");
        });

        it("should throw error when YAML structure is malformed", () => {

            // when
            const failingCall = () => ImportedDeploymentConfigModule.fromYAML(invalidYamlMalformed);

            // then
            expect(failingCall).toThrow(InvalidImportedDeploymentError);
            expect(failingCall).toThrow("Failed to load YAML/JSON formatted definition: bad indentation of a mapping entry (4:8)");
        });
    });

    describe("Test scenarios for #fromJSON", () => {

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
            it(`should parse deployment=${scenario.name} from JSON (deployment definition creation/update via API)`, () => {

                // given
                const deployment = JSON.parse(JSON.stringify(scenario.expected));

                // when
                const result = ImportedDeploymentConfigModule.fromJSON(deployment);

                // then
                expect(result).toBeDefined();
                expect(JSON.stringify(result)).toEqual(JSON.stringify(scenario.expected));
            });
        })
    });
});
