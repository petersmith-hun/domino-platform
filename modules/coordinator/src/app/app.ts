import { DummyCommand, dummyFunction } from "@agent-core/agent-api";

export default class DummyClass {

    public test(): void {
        const dummyCommand: DummyCommand = {
            command: "deployment"
        };
        console.log(`Got command: ${JSON.stringify(dummyCommand)}`);
        dummyFunction();
    }
}
