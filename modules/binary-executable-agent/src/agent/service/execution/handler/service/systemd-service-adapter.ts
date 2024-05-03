import { ServiceHandlerType } from "@bin-exec-agent/domain/common";
import { ServiceAdapter } from "@bin-exec-agent/service/execution/handler/service";
import { commandLineUtility, CommandLineUtility } from "@bin-exec-agent/utility/command-line-utility";

enum SystemdCommand {
    START = "start",
    STOP = "stop",
    RESTART = "restart"
}

/**
 * ServiceAdapter implementation using Debian Systemd service calls for service lifecycle management.
 */
export class SystemdServiceAdapter implements ServiceAdapter {

    private readonly commandLineUtility: CommandLineUtility;

    constructor(commandLineUtility: CommandLineUtility) {
        this.commandLineUtility = commandLineUtility;
    }

    start(serviceName: string): void {
        this.executeServiceCall(serviceName, SystemdCommand.START);
    }

    stop(serviceName: string): void {
        this.executeServiceCall(serviceName, SystemdCommand.STOP);
    }

    restart(serviceName: string): void {
        this.executeServiceCall(serviceName, SystemdCommand.RESTART);
    }

    forServiceHandler(): ServiceHandlerType {
        return ServiceHandlerType.SYSTEMD;
    }

    private executeServiceCall(serviceName: string, command: SystemdCommand): void {
        this.commandLineUtility.execute(`service ${serviceName} ${command}`);
    }
}

export const systemdServiceAdapter = new SystemdServiceAdapter(commandLineUtility);
