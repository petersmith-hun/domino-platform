import { datasourceInitializer } from "@coordinator/core/init/datasource-initializer";
import { deploymentImporterInitializer } from "@coordinator/core/init/deployment-importer-initializer";
import LoggerFactory from "@core-lib/platform/logging";

(async () => {

    for (const initializer of [datasourceInitializer, deploymentImporterInitializer]) {
        try {
            await initializer.init();
        } catch (error: any) {
            LoggerFactory.getLogger("main").error(error?.message, error);
            process.exit(1);
        }
    }

    const { default: coordinatorApplication } = await import("@coordinator/coordinator-application");
    coordinatorApplication.run();
})();
