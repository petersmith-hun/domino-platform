import { DeploymentDefinitionDAO } from "@coordinator/core/dao/deployment-definition-dao";
import { Page } from "@coordinator/core/domain";
import { checksum } from "@coordinator/core/domain/storage";
import { datasourceInitializer } from "@coordinator/core/init/datasource-initializer";
import { Deployment } from "@core-lib/platform/api/deployment";
import {
    dockerAllArgsDeployment,
    dockerAllArgsDeploymentNoUndefinedFields,
    dockerCustomDeployment,
    dockerCustomDeploymentNoUndefinedFields,
    dockerNoArgsDeployment,
    dockerNoArgsDeploymentNoUndefinedFields,
    filesystemExecutableDeployment,
    filesystemExecutableDeploymentNoUndefinedFields,
    filesystemRuntimeDeployment,
    filesystemRuntimeDeploymentNoUndefinedFields,
    filesystemServiceDeployment,
    filesystemServiceDeploymentNoUndefinedFields
} from "@testdata/deployment";

describe("Unit tests for DeploymentDefinitionDAO", () => {

    let deploymentDefinitionDAO: DeploymentDefinitionDAO;

    const allDeployments = [
        filesystemServiceDeployment,
        dockerCustomDeployment,
        dockerAllArgsDeployment,
        dockerNoArgsDeployment,
        filesystemRuntimeDeployment,
        filesystemExecutableDeployment
    ];

    beforeEach(async () => {

        deploymentDefinitionDAO = new DeploymentDefinitionDAO();

        await datasourceInitializer.init();
        for (const deployment of allDeployments) {
            await deploymentDefinitionDAO.save({
                id: deployment.id,
                locked: true,
                definition: deployment
            });
        }
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
                        dockerAllArgsDeploymentNoUndefinedFields,
                        dockerCustomDeploymentNoUndefinedFields,
                        dockerNoArgsDeploymentNoUndefinedFields,
                        filesystemExecutableDeploymentNoUndefinedFields
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
                        filesystemRuntimeDeploymentNoUndefinedFields,
                        filesystemServiceDeploymentNoUndefinedFields
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
                        dockerAllArgsDeploymentNoUndefinedFields,
                        dockerCustomDeploymentNoUndefinedFields,
                        dockerNoArgsDeploymentNoUndefinedFields,
                        filesystemExecutableDeploymentNoUndefinedFields,
                        filesystemRuntimeDeploymentNoUndefinedFields,
                        filesystemServiceDeploymentNoUndefinedFields
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
                    ...scenario.expectedPage,
                    items: []
                };

                // when
                const result = await deploymentDefinitionDAO.findAll(scenario.pageAttributes);

                // then
                expect(result.items.map(item => item.definition)).toStrictEqual(scenario.expectedPage.items);

                result.items = [];
                expect(result).toStrictEqual(expectedPage);
            });
        })
    });

    describe("Test scenarios for #findOne", () => {

        it("should return identified deployment from the registry", async () => {

            // when
            const result = await deploymentDefinitionDAO.findOne(dockerAllArgsDeployment.id);

            // then
            expect(result?.definition).toStrictEqual(dockerAllArgsDeploymentNoUndefinedFields);
            expect(result?.id).toEqual(dockerAllArgsDeployment.id);
            expect(result?.locked).toBeTruthy();
            expect(result?.checksum).toEqual(checksum(JSON.stringify(dockerAllArgsDeployment)));
            expect(result?.createdAt).toBeDefined();
            expect(result?.updatedAt).toBeDefined();
        });
    });

    describe("Test scenarios for #updateLock", () => {

        it("should update lock of existing definition", async () => {

            // when
            const result = await deploymentDefinitionDAO.updateLock(dockerAllArgsDeployment.id, false);

            // then
            expect(result).toBe(true);
        });

        it("should skip updating lock of non-existing definition", async () => {

            // when
            const result = await deploymentDefinitionDAO.updateLock("non-existing", false);

            // then
            expect(result).toBe(false);
        });
    });

    describe("Test scenarios for #delete", () => {

        it("should delete existing definition", async () => {

            // when
            await deploymentDefinitionDAO.delete(dockerAllArgsDeployment.id);

            // then
            expect(await deploymentDefinitionDAO.findOne(dockerAllArgsDeployment.id)).toBeFalsy();
        });

        it("should skip deleting non-existing definition", async () => {

            // when
            await deploymentDefinitionDAO.delete("non-existing");

            // then
            // silent fall-through expected
        });
    });
});
