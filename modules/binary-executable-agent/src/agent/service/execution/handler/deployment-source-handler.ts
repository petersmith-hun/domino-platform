import { DeploymentBinaryReference } from "@bin-exec-agent/domain/common";
import { DeploymentError } from "@bin-exec-agent/error";
import LoggerFactory from "@core-lib/platform/logging";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import fs from "node:fs";
import { IncomingMessage } from "node:http";

/**
 * Controls retrieval of deployment executable.
 */
export class DeploymentSourceHandler {

    private readonly logger = LoggerFactory.getLogger(DeploymentSourceHandler);

    /**
     * Retrieves (downloads) the deployment executable. Upon success, saves the executable file into the deployment
     * storage directory.
     * Warning: currently only HTTP(S) binary sources are supported, this is verified before starting the download.
     *
     * @param deploymentBinaryReference
     */
    public async retrieveBinary(deploymentBinaryReference: DeploymentBinaryReference): Promise<boolean> {

        this.assertRemoteURL(deploymentBinaryReference);
        const response = await this.startDownload(deploymentBinaryReference);

        return this.isSuccessful(response)
            && await this.saveFile(deploymentBinaryReference, response);
    }

    private assertRemoteURL(deploymentBinaryReference: DeploymentBinaryReference) {

        if (!deploymentBinaryReference.sourcePath.startsWith("http")) {
            throw new DeploymentError("Source path must be a valid remote URL");
        }
    }

    private async startDownload(deploymentBinaryReference: DeploymentBinaryReference): Promise<AxiosResponse<IncomingMessage>> {

        this.logger.info(`Downloading executable binary from ${deploymentBinaryReference.sourcePath} ...`);

        return axios.get<IncomingMessage>(deploymentBinaryReference.sourcePath, {
            validateStatus: _ => true,
            responseType: "stream"
        } as AxiosRequestConfig);
    }

    private isSuccessful(response: AxiosResponse<IncomingMessage>): boolean {

        let successful = true;
        if (response.status !== 200 || response.data === null) {
            this.logger.error(`Failed to download binary file, remote server responded with ${response.status}`);
            successful = false;
        }

        return successful;
    }

    private async saveFile(deploymentBinaryReference: DeploymentBinaryReference, response: AxiosResponse<IncomingMessage>): Promise<boolean> {

        const targetFile = response.data.pipe(fs.createWriteStream(deploymentBinaryReference.storePath));

        return new Promise(resolve => {

            let successful = true;

            targetFile
                .on("error", error => {
                    successful = false;
                    this.logger.error(`Failed to write downloaded binary into target file, reason: ${error?.message}`);
                })
                .on("close", () => {
                    if (successful) {
                        this.logger.info(`Downloaded executable binary into ${deploymentBinaryReference.storePath}`);
                    }
                    resolve(successful);
                });
        });
    }
}

export const deploymentSourceHandler = new DeploymentSourceHandler();
