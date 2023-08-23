import LoggerFactory from "@core-lib/platform/logging";

export interface DummyCommand {
    command: string;
}

export function dummyFunction(): void {
    LoggerFactory.getLogger("DummyFunction").info("Dummy function executed")
}
