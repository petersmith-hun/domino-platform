import { ChildProcess, SpawnOptions } from "child_process";
import * as child_process from "node:child_process";

/**
 * Utility implementation for running terminal commands.
 */
export class CommandLineUtility {

    /**
     * Runs an OS command on the terminal.
     *
     * @param command command to be executed
     */
    public execute(command: string): string {
        return child_process.execSync(command, { stdio: "pipe" }).toString();
    }

    /**
     * Spawns an OS process.
     *
     * @param command command to be executed
     * @param args additional execution arguments
     * @param options spawn options
     */
    public spawn(command: string, args: string[], options: SpawnOptions): ChildProcess {
        return child_process.spawn(command, args, options);
    }
}

export const commandLineUtility = new CommandLineUtility();
