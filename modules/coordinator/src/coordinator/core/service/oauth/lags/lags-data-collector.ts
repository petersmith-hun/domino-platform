import { OAuthDescriptor } from "@coordinator/core/domain/oauth";
import { MissingOAuthApplicationError, MissingOAuthPermissionError } from "@coordinator/core/error/error-types";
import {
    OAuthApplicationSummaryModel,
    PermissionModel,
    SimplifiedPageModel
} from "@coordinator/core/service/oauth/lags";

/**
 * Helper component to collect data for OAuth application registration descriptor verification.
 */
export class LAGSDataCollector {

    /**
     * Collects the ID of each client application referenced by the given OAuth descriptor.
     *
     * @param applications list of all currently registered OAuth applications
     * @param descriptor OAuth application registration descriptor
     * @throws MissingOAuthApplicationError if a referenced OAuth application does not exist
     */
    public identifyClientApplications(applications: SimplifiedPageModel<OAuthApplicationSummaryModel>,
                                      descriptor: OAuthDescriptor): Map<string, string> {

        return new Map(descriptor.resourceServer
            ?.allowedClients
            .map(client => {

                const applicationID = applications.content
                    .find(application => application.name === client.name)?.id;
                if (!applicationID) {
                    throw new MissingOAuthApplicationError(client.name);
                }

                return [client.name, applicationID];
            }));
    }

    /**
     * Collects the ID of each permission referenced by the given OAuth descriptor.
     *
     * @param permissions list of all currently registered permissions
     * @param descriptor OAuth application registration descriptor
     * @throws MissingOAuthPermissionError if a referenced permission does not exist
     */
    public identifyPermissions(permissions: SimplifiedPageModel<PermissionModel>,
                               descriptor: OAuthDescriptor): Map<string, string> {

        const allRequestedPermissions = (descriptor.client?.requiredPermissions ?? [])
            .concat(descriptor.resourceServer?.registeredPermissions ?? [])
            .concat(descriptor.resourceServer?.allowedClients
                .flatMap(client => client.allowedPermissions ?? []) ?? []);

        return new Map(allRequestedPermissions
            .map(permissionName => {

                const permissionID = permissions.content
                    .find(permission => permission.name === permissionName)?.id;

                if (!permissionID) {
                    throw new MissingOAuthPermissionError(permissionName);
                }

                return [permissionName, permissionID];
            }));
    }
}

export const lagsDataCollector = new LAGSDataCollector();
