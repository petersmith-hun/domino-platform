import { ConfigurationError, fatal } from "@core-lib/platform/error";
import config from "config";
import { ILogObj, Logger } from "tslog";

type MapValue = string | number | boolean | object | undefined;
export type MapNode = Map<string, MapValue> | undefined;

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

    protected readonly logger?: Logger<ILogObj>;

    protected constructor(configurationNode: string, supplierFunction: (mapNode: MapNode) => T, logger: Logger<ILogObj> | undefined = undefined) {
        this.configurationPath = `domino.${configurationNode}`;
        this.supplierFunction = supplierFunction;
        this.logger = logger;
    }

    /**
     * Returns the parsed configuration object. Throws an error, if the respective configuration module is not yet
     * initialized.
     */
    public getConfiguration(): T {

        if (!this.configuration) {
            throw new ConfigurationError(`Configuration for path=${this.configurationPath} has not been initialized yet.`);
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
    protected init(optional: boolean = false): void {

        try {
            if (optional && !config.has(this.configurationPath)) {
                return;
            }

            this.configuration = this.supplierFunction(config.get(this.configurationPath));
        } catch (error) {
            fatal(error, this.logger);
        }
    }

    /**
     * Extracts a specific configuration node from the given parent node.
     *
     * @param parameters contents of the currently inspected configuration node
     * @param node configuration node name
     * @protected can only be used by concrete implementations
     */
    protected getNode(parameters: MapNode, node: CK): MapNode {
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
    protected getValue<V>(parameters: MapNode, key: CK, defaultValue?: any): V {

        return (parameters?.has(key)
            ? parameters.get(key)
            : defaultValue) as V;
    }

    /**
     * Extracts a specific configuration value from the given configuration object.
     *
     * @param parameters contents of the currently inspected configuration node as object
     * @param key configuration key
     * @param defaultValue default value if the parameter is not specified (defaults to empty string)
     * @protected can only be used by concrete implementations
     */
    protected getValueFromObject<V>(parameters: object, key: CK, defaultValue?: any): V {

        return key in parameters
            ? parameters[key as keyof typeof parameters]
            : defaultValue as V;
    }

    /**
     * Extracts a specific configuration value from the given configuration node. A resolvable value is always expected,
     * throws ConfigurationError otherwise.
     *
     * @param parameters contents of the currently inspected configuration node
     * @param key configuration key
     * @protected can only be used by concrete implementations
     */
    protected getMandatoryValue<V>(parameters: MapNode, key: CK): V {

        const value = this.getValue(parameters, key) as V;
        if (value === undefined) {
            throw new ConfigurationError(`Missing mandatory configuration parameter '${key}'`);
        }

        return value;
    }
}
