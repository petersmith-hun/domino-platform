import { version } from "@coordinator-package";
import { AppInfoConfigModule } from "@coordinator/core/config/app-info-config-module";

describe("Unit tests for AppInfoConfigModule", () => {

    let appInfoConfigModule: AppInfoConfigModule;

    beforeEach(() => {
        appInfoConfigModule = new AppInfoConfigModule();
    });

    describe("Test scenarios for #getConfiguration", () => {

        it("should return the configuration values provided in test.yml", () => {

            // when
            const result = appInfoConfigModule.getConfiguration();

            // then
            expect(result.applicationName).toBe("Domino Platform Coordinator TEST");
            expect(result.abbreviation).toBe("DPC-TEST");
            expect(result.version).toBe(version);
            expect(result.buildTime).not.toBeNull();
        });
    });
});
