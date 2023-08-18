import config from "config";

type MapValue = string | number | boolean | object | undefined;
type MapNode = Map<string, MapValue> | undefined;

/**
 * Abstract configuration handler implementation. Implementations must provide their respective sub-node of the
 * environment-specific configuration, as well as the configuration value mapping for each field.
 *
 * @param T configuration data object type
 * @param CK possible configuration keys
 */
export abstract class ConfigurationModule<T, CK extends string> {

    private readonly configurationPath: string;
    private readonly supplierFunction: (mapNode: MapNode) => T;
    private configuration?: T;

    protected constructor(configurationNode: string, supplierFunction: (mapNode: MapNode) => T) {
        this.configurationPath = `domino.${configurationNode}`;
        this.supplierFunction = supplierFunction;
    }

    /**
     * Returns the parsed configuration object. Throws an error, if the respective configuration module is not yet
     * initialized.
     */
    public getConfiguration(): T {

        if (!this.configuration) {
            throw new Error(`Configuration for path=${this.configurationPath} has not been initialized yet.`);
        }

        return this.configuration!;
    }

    /**
     * Initializes the configuration module by extracting the configuration node from the configuration file and
     * executing the mapping logic. This method must be called from the concrete implementations' constructor,
     * right after the super constructor call.
     *
     * @protected can only be used by concrete implementations
     */
    protected init(): void {
        this.configuration = this.supplierFunction(config.get(this.configurationPath));
    }

    /**
     * Extracts an entire segment (node) of the given configuration node.
     *
     * @param parameters contents of the currently inspected configuration node
     * @param node name of the sub-node to be extracted
     * @protected can only be used by concrete implementations
     */
    protected getNode(parameters: MapNode, node: string): MapNode {
        return parameters?.get(node) as MapNode;
    }

    /**
     * Extracts a specific configuration value from the given configuration node.
     *
     * @param parameters contents of the currently inspected configuration node
     * @param key configuration key
     * @param defaultValue default value if the parameter is not specified (defaults to empty string)
     * @protected can only be used by concrete implementations
     */
    protected getValue<V>(parameters: MapNode, key: CK, defaultValue: string | number | boolean = ""): V {

        return (parameters?.has(key)
            ? parameters.get(key)
            : defaultValue) as V;
    }
}
