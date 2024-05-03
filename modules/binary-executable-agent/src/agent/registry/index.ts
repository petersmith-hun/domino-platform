/**
 * Interface for registry-like implementations.
 */
export interface Registry {

    /**
     * Initialization step for the registry implementation. Should be executed during agent initialization.
     */
    initialize(): void;
}
