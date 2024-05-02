import { ServiceHandlerType } from "@bin-exec-agent/domain/common";
import { ServiceAdapterRegistry } from "@bin-exec-agent/registry/service-adapter-registry";
import { ServiceAdapter } from "@bin-exec-agent/service/execution/handler/service";
import { SystemdServiceAdapter } from "@bin-exec-agent/service/execution/handler/service/systemd-service-adapter";
import { spawnControlConfig } from "@testdata";
import sinon, { SinonStubbedInstance } from "sinon";

describe("Unit tests for ServiceAdapterRegistry", () => {

    let serviceAdapterMockSystemd: SinonStubbedInstance<ServiceAdapter>;
    let serviceAdapterMockOther: SinonStubbedInstance<ServiceAdapter>;
    let serviceAdapterRegistry: ServiceAdapterRegistry;

    beforeEach(() => {
        serviceAdapterMockSystemd = sinon.createStubInstance(SystemdServiceAdapter);
        serviceAdapterMockOther = sinon.createStubInstance(SystemdServiceAdapter);

        serviceAdapterMockSystemd.forServiceHandler.returns(ServiceHandlerType.SYSTEMD);
        serviceAdapterMockOther.forServiceHandler.returns("other" as ServiceHandlerType);

        serviceAdapterRegistry = new ServiceAdapterRegistry(spawnControlConfig, [
            serviceAdapterMockSystemd,
            serviceAdapterMockOther
        ])
    });

    describe("Test scenarios for #initialize", () => {

        it("should select systemd service adapter", () => {

            // when
            serviceAdapterRegistry.initialize();

            // then
            // @ts-ignore
            expect(serviceAdapterRegistry.selectedServiceAdapter).toBe(serviceAdapterMockSystemd);
        });

        it("should throw error for unavailable service handler", () => {

            // given
            serviceAdapterRegistry = new ServiceAdapterRegistry(spawnControlConfig, [
                serviceAdapterMockOther
            ]);

            // when
            const failingCall = () => serviceAdapterRegistry.initialize();

            // then
            expect(failingCall).toThrowError("Configured service adapter systemd is not available");
        });
    });

    describe("Test scenarios for #getServiceAdapter", () => {

        it("should return the selected service adapter", () => {

            // given
            serviceAdapterRegistry.initialize();

            // when
            const result = serviceAdapterRegistry.getServiceAdapter();

            // then
            expect(result).toBe(serviceAdapterMockSystemd);
        });

        it("should throw error if registry is not yet initialized", () => {

            // when
            const failingCall = () => serviceAdapterRegistry.getServiceAdapter();

            // then
            expect(failingCall).toThrowError("Service adapter registry is not initialized");
        });
    });
});
