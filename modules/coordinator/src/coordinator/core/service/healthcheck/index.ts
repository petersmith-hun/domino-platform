import { DeploymentHealthcheck } from "@core-lib/platform/api/deployment";

/**
 * Read-only interface for healthcheck request attempt counter.
 */
export interface ReadOnlyAttempt {

    /**
     * Number of max attempts;
     */
    maxAttempts: number;

    /**
     * Returns the number of attempts left.
     */
    get attemptsLeft(): number;

    /**
     * Checks if attempt limit is reached.
     */
    isLimitReached(): boolean;
}

/**
 * Domain class representing a healthcheck request's attempt counter.
 */
export class Attempt implements ReadOnlyAttempt{

    readonly maxAttempts: number;
    private _attemptsLeft: number;

    constructor(healthcheck: DeploymentHealthcheck) {
        this.maxAttempts = healthcheck.maxAttempts;
        this._attemptsLeft = healthcheck.maxAttempts;
    }

    get attemptsLeft(): number {
        return this._attemptsLeft;
    }

    /**
     * Decreases the attempt counter.
     */
    attempted(): void {

        if (this._attemptsLeft > 0) {
            this._attemptsLeft--;
        }
    }

    isLimitReached(): boolean {
        return this._attemptsLeft === 0;
    }
}
