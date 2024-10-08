/**
 * Interface for components that need to be executed on startup.
 */
export interface Initializer {

    /**
     * Executes initialization steps of the marked component.
     */
    init(): Promise<void>;
}
