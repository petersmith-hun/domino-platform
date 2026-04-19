import { OAuthDescriptor } from "@coordinator/core/domain/oauth";

/**
 * Response model representing a permission.
 */
export interface PermissionModel {

    id: string;
    name: string;
    description: string;
    enabled: boolean;
    created: string;
    lastModified: string;
}

/**
 * Known OAuth application types.
 */
export enum ApplicationType {
    UI = "UI",
    SERVICE = "SERVICE"
}

/**
 * Response model representing the summary (for listing) of an OAuth application.
 */
export interface OAuthApplicationSummaryModel {

    id: string;
    name: string;
    clientID: string;
    applicationType: ApplicationType;
    enabled: boolean;
    created: string;
    lastModified: string;
}

/**
 * Response model representing a target application (in an allowed client or resource server segment) of an OAuth application.
 */
export interface TargetApplicationModel {

    id: string;
    name: string;
    clientID: string;
}

/**
 * Response model representing an allowed client of an OAuth application.
 */
export interface AllowedClientModel {

    id: string;
    application: TargetApplicationModel;
    allowedPermissions: PermissionModel[];
}

/**
 * Response model representing an allowed callback of an OAuth application.
 */
export interface CallbackModel {

    id: string;
    url: string;
}

/**
 * Response model representing the client settings of an OAuth application.
 */
export interface ClientApplicationModel {

    allowedCallbacks: CallbackModel[];
    requiredPermissions: PermissionModel[];
    resourceServers: TargetApplicationModel[];
}

/**
 * Response model representing resource server settings of an OAuth application.
 */
export interface ResourceServerApplicationModel {

    audience: string;
    registeredPermissions: PermissionModel[];
    allowedClients: AllowedClientModel[];
}

/**
 * Extension of the OAuthApplicationSummaryModel including the client and resource server settings (all details) of an OAuth application.
 */
export interface OAuthApplicationModel extends OAuthApplicationSummaryModel {

    client?: ClientApplicationModel;
    resourceServer?: ResourceServerApplicationModel;
}

/**
 * Represents the registration type options.
 */
export enum RegistrationType {
    CLIENT = 'CLIENT',
    RESOURCE_SERVER = 'RESOURCE_SERVER',
    MIDDLE_RESOURCE_SERVER = 'MIDDLE_RESOURCE_SERVER',
}

/**
 * Request model representing an allowed callback.
 */
export interface AllowedCallbackRequest {
    id?: string;
    url: string;
}

/**
 * Request model representing the client settings of an OAuth application.
 */
export interface ClientApplicationRequest {
    allowedCallbacks?: AllowedCallbackRequest[];
    requiredPermissions: string[];
}

/**
 * Request model representing an allowed client of an OAuth application.
 */
export interface AllowedClientRequest {
    applicationID: string;
    allowedPermissions: string[];
}

/**
 * Request model representing resource server settings of an OAuth application.
 */
export interface ResourceServerApplicationRequest {
    audience: string;
    registeredPermissions: string[];
    allowedClients: AllowedClientRequest[];
}

/**
 * Request model for creating an OAuth application.
 */
export interface OAuthApplicationRegistrationRequest {
    name: string;
    clientID: string;
    registrationType: RegistrationType;
    client?: ClientApplicationRequest;
    resourceServer?: ResourceServerApplicationRequest;
}

/**
 * Response model for an OAuth application registration request.
 */
export interface OAuthApplicationRegistrationResponse {
    id: string;
    clientSecret?: string;
}

/**
 * Response model representing a page of items in the simplified fashion, used by LAGS and Domino.
 */
export interface SimplifiedPageModel<T> {

    content: T[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    }
}

/**
 * Internal domain class for holding resolved and verified information of an application registration process.
 */
export class RegistrationContext {

    readonly name!: string;
    readonly descriptor!: OAuthDescriptor;
    readonly applicationMap!: Map<string, string>;
    readonly permissionMap!: Map<string, string>;
    readonly registeredApplication?: OAuthApplicationModel;

    constructor(options: RegistrationContext) {
        Object.assign(this, { ... options });
    }
}

