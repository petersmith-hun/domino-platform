import { SpawnControlConfig, spawnControlConfigModule } from "@bin-exec-agent/config/spawn-control-config-module";
import { ExecutorUser } from "@bin-exec-agent/domain/common";
import { ExecutorUserError } from "@bin-exec-agent/error";
import { Registry } from "@bin-exec-agent/registry";
import { commandLineUtility, CommandLineUtility } from "@bin-exec-agent/utility/command-line-utility";
import LoggerFactory from "@core-lib/platform/logging";

const validUsernamePattern = /^[a-zA-Z0-9_\-]+$/;

enum UserIDType {

    USER_ID = "-u",
    GROUP_ID = "-g"
}

/**
 * Registry implementation to control registered executor users.
 */
export class ExecutorUserRegistry implements Registry {

    private readonly logger = LoggerFactory.getLogger(ExecutorUserRegistry);
    private readonly spawnControlConfig: SpawnControlConfig;
    private readonly commandLineUtility: CommandLineUtility;

    private executorUsers!: Map<string, ExecutorUser>;

    constructor(spawnControlConfig: SpawnControlConfig, commandLineUtility: CommandLineUtility) {
        this.spawnControlConfig = spawnControlConfig;
        this.commandLineUtility = commandLineUtility;
    }

    /**
     * Validates and reads information of registered executor users. Registration process is interrupted, if a
     * configured user's name does not conform the expected name pattern or the user itself does not exist in the host
     * system. On successful registration, the user's and its group's ID are stored in the registry, accessible via
     * the configured username.
     */
    initialize(): void {

        this.logger.info("Registering executor users ...");

        this.executorUsers = new Map<string, ExecutorUser>(this.spawnControlConfig
            .allowedExecutorUsers
            .map(username => this.assertValidUsername(username))
            .map(username => [username, this.registerUser(username)]));
    }

    /**
     * Returns a registered executor user's descriptor object by its related username, if exists. Otherwise, throws error.
     *
     * @param username executor username (coming from a deployment configuration)
     *
     */
    public getUser(username: string): ExecutorUser {

        if (!this.executorUsers) {
            throw new ExecutorUserError("Executor user registry is not yet initialized");
        }

        const user = this.executorUsers.get(username);
        if (!user) {
            throw new ExecutorUserError(`User ${username} is not registered as allowed executor user`);
        }

        return user;
    }

    private assertValidUsername(username: string): string {

        if (!username.match(validUsernamePattern)) {
            throw new ExecutorUserError(`Username ${username} is invalid`);
        }

        return username;
    }

    private registerUser(username: string): ExecutorUser {

        const executorUser = {
            userID: this.findUserID(username, UserIDType.USER_ID),
            groupID: this.findUserID(username, UserIDType.GROUP_ID)
        };

        this.logger.info(`Registered executor user ${username} (uid=${executorUser.userID}, gid=${executorUser.groupID})`);

        return executorUser
    }

    private findUserID(username: string, userIDType: UserIDType): number {

        try {
            const idCallResult = this.commandLineUtility.execute(`id ${userIDType} ${username}`);
            return parseInt(idCallResult);
        } catch (error: any) {
            throw new ExecutorUserError(`Could not process user by username ${username}`);
        }
    }
}

export const executorUserRegistry = new ExecutorUserRegistry(spawnControlConfigModule.getConfiguration(), commandLineUtility);
