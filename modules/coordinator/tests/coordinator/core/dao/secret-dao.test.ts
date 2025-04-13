import { SecretDAO } from "@coordinator/core/dao/secret-dao";
import { SecretCreationAttributes } from "@coordinator/core/domain/storage";
import { datasourceInitializer } from "@coordinator/core/init/datasource-initializer";
import { encryptionHandler } from "@coordinator/core/service/encryption/encryption-handler";
import { secret1Creation, secret2Creation, secret3Creation, secretNewCreation } from "@testdata/core";

describe("Unit tests for SecretDAO", () => {

    let secretDAO: SecretDAO;

    const allSecrets = [
        secret1Creation,
        secret2Creation,
        secret3Creation
    ];

    beforeEach(async () => {

        secretDAO = new SecretDAO();

        await datasourceInitializer.init();
        for (const secret of allSecrets) {
            await secretDAO.save(secret);
        }
    });

    describe("Test scenarios for #findOne", () => {

        it("should retrieve existing secret", async () => {

            // when
            const result = await secretDAO.findOne(secret1Creation.key);

            // then
            expect(result).toBeDefined();
            expect(result?.key).toEqual(secret1Creation.key);
            expect(result?.value).toEqual(secret1Creation.value);
            expect(result?.context).toEqual(secret1Creation.context);
            expect(result?.retrievable).toBe(false);
            expect(result?.createdAt).toBeDefined();
            expect(result?.updatedAt).toBeDefined();
            expect(result?.lastAccessedAt).toBeNull();
            expect(result?.lastAccessedBy).toBeNull();
        });

        it("should return null for non-existing secret", async () => {

            // when
            const result = await secretDAO.findOne("non-existing-secret");

            // then
            expect(result).toBeNull();
        });
    });

    describe("Test scenarios for #findAll", () => {

        it("should return all existing secrets", async () => {

            // when
            const result = await secretDAO.findAll();

            // then
            expect(result.length).toBe(3);
            expect(result.map(secret => secret.key)).toStrictEqual([secret1Creation.key, secret2Creation.key, secret3Creation.key]);
            expect(result.map(secret => secret.value)).toStrictEqual([secret1Creation.value, secret2Creation.value, secret3Creation.value]);
        });
    });

    describe("Test scenarios for #findAllByContext", () => {

        type Scenario = {
            context: string,
            expectedResults: SecretCreationAttributes[]
        }

        const scenarios: Scenario[] = [
            { context: "context1", expectedResults: [secret1Creation, secret2Creation] },
            { context: "context2", expectedResults: [secret3Creation] },
        ];

        scenarios.forEach(scenario => {

            it(`should return secrets for context=${scenario.context}`, async () => {

                // when
                const result = await secretDAO.findAllByContext(scenario.context);

                // then
                expect(result.length).toBe(scenario.expectedResults.length);
                expect(result.map(secret => secret.key)).toStrictEqual(scenario.expectedResults.map(secret => secret.key));
                expect(result.map(secret => secret.value)).toStrictEqual(scenario.expectedResults.map(secret => secret.value));
            });
        })
    });

    describe("Test scenarios for #save", () => {

        it("should create new secret", async () => {

            // when
            await secretDAO.save(secretNewCreation);

            // then
            const result = await secretDAO.findOne(secretNewCreation.key);
            expect(result).toBeDefined();
            expect(result?.key).toEqual(secretNewCreation.key);
            expect(result?.value).toEqual(secretNewCreation.value);
            expect(result?.context).toEqual(secretNewCreation.context);
            expect(result?.retrievable).toBe(false);
            expect(result?.createdAt).toBeDefined();
            expect(result?.updatedAt).toBeDefined();
            expect(result?.lastAccessedAt).toBeNull();
            expect(result?.lastAccessedBy).toBeNull();

            expect(result?.dataValues.value).not.toEqual(secretNewCreation.value);
            expect(encryptionHandler.decrypt(result!.dataValues.value)).toEqual(secretNewCreation.value);

            expect((await secretDAO.findAll()).length).toBe(4);
        });
    });

    describe("Test scenarios for #updateRetrievable", () => {

        it("should flip retrievable flag", async () => {

            // given
            const initial = await secretDAO.findOne(secret1Creation.key);
            expect(initial?.retrievable).toBe(false);

            // when
            await secretDAO.updateRetrievable(initial!, true);

            // then
            const afterEnabling = await secretDAO.findOne(secret1Creation.key);
            expect(afterEnabling?.retrievable).toBe(true);

            // when
            await secretDAO.updateRetrievable(afterEnabling!, false);

            // then
            const afterDisabling = await secretDAO.findOne(secret1Creation.key);
            expect(afterDisabling?.retrievable).toBe(false);
        });
    });

    describe("Test scenarios for #updatedLastAccess", () => {

        it("should update last access", async () => {

            // given
            const accessedBy = "user1";
            const initial = await secretDAO.findOne(secret1Creation.key);

            expect(initial?.lastAccessedAt).toBeNull();
            expect(initial?.lastAccessedBy).toBeNull();

            // when
            await secretDAO.updateLastAccess(initial!, accessedBy);

            // then
            const afterUpdate = await secretDAO.findOne(secret1Creation.key);
            expect(afterUpdate?.lastAccessedAt).toBeDefined();
            expect(afterUpdate?.lastAccessedBy).toBe(accessedBy);
        });
    });

    describe("Test scenarios for #delete", () => {

        it("should delete secret", async () => {

            // when
            await secretDAO.delete(secret1Creation.key);

            // then
            expect(await secretDAO.findOne(secret1Creation.key)).toBeNull();
            expect((await secretDAO.findAll()).length).toBe(2);
        });

        it("should skip deleting non-existing secret", async () => {

            // when
            await secretDAO.delete("non-existing");

            // then
            // silent fall-through expected
            expect((await secretDAO.findAll()).length).toBe(3);
        });
    });
});
