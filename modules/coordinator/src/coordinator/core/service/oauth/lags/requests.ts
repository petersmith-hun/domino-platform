/**
 * Supported API request methods.
 */
export enum RequestMethod {

  GET = "get",
  POST = "post",
  PUT = "put",
  DELETE = "delete"
}

/**
 * REST request descriptor for the baseRestClient implementation.
 */
export class RESTRequest {

  /**
   * Request method.
   */
  readonly method!: RequestMethod;

  /**
   * (Unresolved) API resource path.
   */
  readonly path!: string;

  /**
   * Optional request body.
   */
  readonly requestBody?: unknown;

  /**
   * Authorization header.
   */
  readonly authorization?: Record<string, string>;

  /**
   * Optional path parameters to resolve the given parameterized path.
   */
  readonly pathParameters?: Record<string, string | number>;

  /**
   * Optional query parameters.
   */
  readonly queryParameters?: Record<any, any>;

  /**
   * Optional additional headers.
   */
  readonly headers?: Record<string, string>;

  /**
   * Optional parameter to enable streaming response.
   */
  readonly streaming?: boolean;

  constructor(opts: RESTRequest) {
    Object.assign(this, {
      authorization: {},
      pathParameters: {},
      queryParameters: {},
      headers: {},
      ... opts
    });
  }
}
