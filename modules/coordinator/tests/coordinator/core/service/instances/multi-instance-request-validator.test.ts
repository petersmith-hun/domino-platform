import { DeploymentAttributes } from "@coordinator/core/domain";
import { DeploymentValidationError } from "@coordinator/core/error/error-types";
import { MultiInstanceRequestValidator } from "@coordinator/core/service/instances/multi-instance-request-validator";
import { Deployment, InstanceNamingStrategy } from "@core-lib/platform/api/deployment";

describe("Unit tests for MultiInstanceRequestValidator", () => {

    let multiInstanceRequestValidator: MultiInstanceRequestValidator;

    beforeEach(() => {
        multiInstanceRequestValidator = new MultiInstanceRequestValidator();
    });

    describe("Test scenarios for #validateLifecycleRequest", () => {

        type Scenario = { deployment: Deployment, attributes: DeploymentAttributes, errorMessage?: string };

        const positiveScenarios: Scenario[] = [
            {
                deployment: deployment(true, InstanceNamingStrategy.INCREMENTAL_SUFFIX, []),
                attributes: deploymentAttributes(true)
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.INCREMENTAL_SUFFIX, []),
                attributes: deploymentAttributes(false, "0")
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.INCREMENTAL_SUFFIX, []),
                attributes: deploymentAttributes(false, "1")
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.CUSTOM_PREDEFINED, ["live"]),
                attributes: deploymentAttributes(true)
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.CUSTOM_PREDEFINED, ["primary", "secondary"]),
                attributes: deploymentAttributes(false, "primary")
            }
        ];

        positiveScenarios.forEach(scenario => {

            it(`should consider request valid for deployment=${JSON.stringify(scenario)}`, async () => {

                // when
                multiInstanceRequestValidator.validateLifecycleRequest(scenario.attributes, scenario.deployment);

                // then
                // silent fallthrough expected
            });
        });

        const negativeScenarios: Scenario[] = [
            {
                deployment: deployment(false, InstanceNamingStrategy.INCREMENTAL_SUFFIX, []),
                attributes: deploymentAttributes(true),
                errorMessage: "Requested lifecycle operation for deployment app with attributes [roll=true; instance=undefined] is not supported: Multi-instance deployment is not enabled for this deployment"
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.INCREMENTAL_SUFFIX, []),
                attributes: deploymentAttributes(false),
                errorMessage: "Requested lifecycle operation for deployment app with attributes [roll=false; instance=undefined] is not supported: Multi-instance deployment attribute is expected for this deployment"
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.INCREMENTAL_SUFFIX, []),
                attributes: deploymentAttributes(true, "1"),
                errorMessage: "Requested lifecycle operation for deployment app with attributes [roll=true; instance=1] is not supported: Rolling all instances and an exact instance at once is not possible"
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.CUSTOM_PREDEFINED, ["live"]),
                attributes: deploymentAttributes(true, "live"),
                errorMessage: "Requested lifecycle operation for deployment app with attributes [roll=true; instance=live] is not supported: Rolling all instances and an exact instance at once is not possible"
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.INCREMENTAL_SUFFIX, []),
                attributes: deploymentAttributes(false, "primary"),
                errorMessage: "Requested lifecycle operation for deployment app with attributes [roll=false; instance=primary] is not supported: Requested instance suffix is not valid for this deployment"
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.INCREMENTAL_SUFFIX, []),
                attributes: deploymentAttributes(false, "2"),
                errorMessage: "Requested lifecycle operation for deployment app with attributes [roll=false; instance=2] is not supported: Requested instance suffix is not valid for this deployment"
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.INCREMENTAL_SUFFIX, []),
                attributes: deploymentAttributes(false, "3"),
                errorMessage: "Requested lifecycle operation for deployment app with attributes [roll=false; instance=3] is not supported: Requested instance suffix is not valid for this deployment"
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.INCREMENTAL_SUFFIX, []),
                attributes: deploymentAttributes(false, "-1"),
                errorMessage: "Requested lifecycle operation for deployment app with attributes [roll=false; instance=-1] is not supported: Requested instance suffix is not valid for this deployment"
            },
            {
                deployment: deployment(true, InstanceNamingStrategy.CUSTOM_PREDEFINED, ["primary", "secondary"]),
                attributes: deploymentAttributes(false, "unknown"),
                errorMessage: "Requested lifecycle operation for deployment app with attributes [roll=false; instance=unknown] is not supported: Requested instance suffix is not valid for this deployment"
            }
        ];

        negativeScenarios.forEach(scenario => {

            it(`should consider request invalid for deployment=${JSON.stringify(scenario)}`, async () => {

                // when
                const failingCall = () => multiInstanceRequestValidator.validateLifecycleRequest(scenario.attributes, scenario.deployment);

                // then
                // exception expected
                expect(failingCall).toThrow(DeploymentValidationError);
                expect(failingCall).toThrow(scenario.errorMessage);
            });
        });
    });

    function deployment(enabled: boolean, namingStrategy: InstanceNamingStrategy, definedNames: string[]): Deployment {

        return {
            target: {
                multiInstance: { enabled, namingStrategy, definedNames, instanceCount: 2 }
            }
        } as Deployment;
    }

    function deploymentAttributes(roll: boolean, instance?: string): DeploymentAttributes {
        return { deployment: "app", roll, instance }
    }
});
