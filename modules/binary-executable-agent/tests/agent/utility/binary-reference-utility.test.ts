import { BinaryReferenceUtility } from "@bin-exec-agent/utility/binary-reference-utility";
import {
    deploymentBinaryReferenceExactVersion,
    deploymentBinaryReferenceLatestVersion,
    deploymentDomino,
    deploymentLeaflet,
    deploymentVersionExact,
    deploymentVersionLatest,
    lifecycleBinaryReferenceLeaflet,
    storageConfig
} from "@testdata";

describe("Unit tests for BinaryReferenceUtility", () => {

    let binaryReferenceUtility: BinaryReferenceUtility;

    beforeEach(() => {
        binaryReferenceUtility = new BinaryReferenceUtility(storageConfig);
    });

    describe("Test scenarios for #createDeploymentReference", () => {

        it("should create the deployment binary reference for an exact version deployment", () => {

            // when
            const result = binaryReferenceUtility.createDeploymentReference(deploymentDomino, deploymentVersionExact);

            // then
            expect(result).toStrictEqual(deploymentBinaryReferenceExactVersion);
        });

        it("should create the deployment binary reference for a latest version deployment", () => {

            // when
            const result = binaryReferenceUtility.createDeploymentReference(deploymentDomino, deploymentVersionLatest);

            // then
            expect(result).toStrictEqual(deploymentBinaryReferenceLatestVersion);
        });
    });

    describe("Test scenarios for #createLifecycleReference", () => {

        it("should create the lifecycle binary reference", () => {

            // when
            const result = binaryReferenceUtility.createLifecycleReference(deploymentLeaflet);

            // then
            expect(result).toStrictEqual(lifecycleBinaryReferenceLeaflet);
        });
    });
});
