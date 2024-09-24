import { ResponseWrapper } from "@coordinator/web/model/common";
import { NextFunction, Request, Response } from "express";

type ConstructableMapping<Input> = new (request: Request) => Input;
type CallableMapping<Input> = (request: Request) => Input;
type ParameterMapping<Input> = ConstructableMapping<Input> | CallableMapping<Input>;

/**
 * Abstract base implementation providing a convenient way to register an endpoint in Express.
 * Calling the register method of the actual implementations creates an arrow expression, expecting the standard Express
 * request handler parameters (request, response and next function) for the given controller entry point. Since the
 * controllers might expect a specific request model, this helper component also deals with converting the "raw" request
 * object into the defined request model. Also attaches a response handler and an exception handler to each of the registrations.
 */
abstract class MappingHelper {

    /**
     * Converts the response of the controller into an Express response object, by doing the following steps:
     *  - Sets the response status;
     *  - And sends the response body (by either sending the raw response content directly, or converting it to JSON).
     *
     * @param responseWrapper ResponseWrapper object containing the controller response context
     * @param response Express Response object
     */
    protected mapResponse(responseWrapper: ResponseWrapper<any>, response: Response): void {

        response.status(responseWrapper.status);

        if (!responseWrapper.content) {
            response.send();
        } else {
            response.json(responseWrapper.content);
        }
    }

    /**
     * Handles errors thrown by the attached controller endpoint by passing it forward in next Express function.
     *
     * @param endpointCall attached raw endpoint call
     */
    protected catchAsyncError(endpointCall: (request: Request, response: Response) => void): (request: Request, response: Response, next: NextFunction) => void {

        return async (request, response, next) => {

            try {
                await endpointCall(request, response);
            } catch (error) {
                next(error);
            }
        };
    }
}

/**
 * MappingHelper implementation for endpoint registrations not expecting any request model.
 */
export class ParameterlessMappingHelper extends MappingHelper {

    /**
     * Registers the given endpoint without request model conversion.
     * Attaches response mapping and async error handling.
     *
     * @param endpointCall controller endpoint call to be registered
     * @returns Express request handler definition
     */
    public register(endpointCall: () => Promise<ResponseWrapper<any>> | ResponseWrapper<any>): (request: Request, response: Response, next: NextFunction) => void {
        return this.catchAsyncError(async (_: Request, response: Response) => this.mapResponse(await endpointCall(), response));
    }
}

/**
 * MappingHelper implementation for endpoint registrations expecting a request model.
 * Request model conversion function can be defined as constructor parameter, expecting a request model type, the
 * constructor of which must expect an Express Request object.
 */
export class ParameterizedMappingHelper<Input> extends MappingHelper {

    private readonly inputMapping: ParameterMapping<Input>;

    constructor(inputMapping: ParameterMapping<Input>) {
        super();
        this.inputMapping = inputMapping;
    }

    /**
     * Registers the given endpoint with request model conversion.
     * Attaches response mapping and async error handling. Response mapping requires an input mapping function given
     * in the constructor.
     *
     * @param endpointCall controller endpoint call to be registered
     * @returns Express request handler definition
     */
    public register(endpointCall: (input: Input) => Promise<ResponseWrapper<any>> | ResponseWrapper<any>): (request: Request, response: Response, next: NextFunction) => void {
        return this.catchAsyncError(async (request: Request, response: Response) => {
            const input = this.inputMapping.prototype?.constructor
                // @ts-ignore
                ? new this.inputMapping(request)
                // @ts-ignore
                : this.inputMapping(request);
            this.mapResponse(await endpointCall(input), response);
        });
    }
}

