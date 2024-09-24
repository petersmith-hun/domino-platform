import { DeploymentRegistry } from "@coordinator/core/config/deployment-config-module";
import { DeploymentDefinitionDAO } from "@coordinator/core/dao/deployment-definition-dao";
import { Page } from "@coordinator/core/domain";
import { Deployment } from "@core-lib/platform/api/deployment";
import {
    dockerAllArgsDeployment,
    dockerCustomDeployment,
    dockerNoArgsDeployment,
    filesystemExecutableDeployment,
    filesystemRuntimeDeployment,
    filesystemServiceDeployment
} from "@testdata/deployment";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for DeploymentDefinitionDAO", () => {

    let deploymentRegistryMock: SinonStubbedInstance<DeploymentRegistry>;
    let deploymentDefinitionDAO: DeploymentDefinitionDAO;

    beforeEach(() => {
        deploymentRegistryMock = sinon.createStubInstance(DeploymentRegistry);

        deploymentDefinitionDAO = new DeploymentDefinitionDAO(deploymentRegistryMock);
    });

    describe("Test scenarios for #findAll", () => {

        type Scenario = {
            pageAttributes: { page: number, limit: number },
            expectedPage: { itemCountOnPage: number, totalPages: number, items: Deployment[] }
        }

        const scenarios: Scenario[] = [
            {
                pageAttributes: {
                    page: 1,
                    limit: 4
                },
                expectedPage: {
                    itemCountOnPage: 4,
                    totalPages: 2,
                    items: [
                        dockerAllArgsDeployment,
                        dockerCustomDeployment,
                        dockerNoArgsDeployment,
                        filesystemExecutableDeployment
                    ]
                },
            },
            {
                pageAttributes: {
                    page: 2,
                    limit: 4
                },
                expectedPage: {
                    itemCountOnPage: 2,
                    totalPages: 2,
                    items: [
                        filesystemRuntimeDeployment,
                        filesystemServiceDeployment
                    ]
                },
            },
            {
                pageAttributes: {
                    page: 1,
                    limit: 10
                },
                expectedPage: {
                    itemCountOnPage: 6,
                    totalPages: 1,
                    items: [
                        dockerAllArgsDeployment,
                        dockerCustomDeployment,
                        dockerNoArgsDeployment,
                        filesystemExecutableDeployment,
                        filesystemRuntimeDeployment,
                        filesystemServiceDeployment
                    ]
                },
            },
            {
                pageAttributes: {
                    page: 2,
                    limit: 10
                },
                expectedPage: {
                    itemCountOnPage: 0,
                    totalPages: 1,
                    items: []
                },
            }
        ]

        scenarios.forEach(scenario => {
            it(`should return page of deployments with calculated page for page number ${scenario.pageAttributes.page} with limit ${scenario.pageAttributes.limit}`, async () => {

                // given
                const expectedPage: Page<Deployment> = {
                    totalItemCount: 6,
                    pageNumber: scenario.pageAttributes.page,
                    pageSize: scenario.pageAttributes.limit,
                    ...scenario.expectedPage
                };

                deploymentRegistryMock.getAllDeployments.returns([
                    filesystemServiceDeployment,
                    dockerCustomDeployment,
                    dockerAllArgsDeployment,
                    dockerNoArgsDeployment,
                    filesystemRuntimeDeployment,
                    filesystemExecutableDeployment
                ]);

                // when
                const result = await deploymentDefinitionDAO.findAll(scenario.pageAttributes);

                // then
                expect(result).toStrictEqual(expectedPage);
            });
        })
    });

    describe("Test scenarios for #findOne", () => {

        it("should return identified deployment from the registry", async () => {

            // given
            deploymentRegistryMock.getDeployment.withArgs(dockerAllArgsDeployment.id).resolves(dockerAllArgsDeployment);

            // when
            const result = await deploymentDefinitionDAO.findOne(dockerAllArgsDeployment.id);

            // then
            expect(result).toStrictEqual(dockerAllArgsDeployment);
        });
    });
});
