import { IsNotEmpty } from "class-validator";
import { Request } from "express";

/**
 * Request model for direct authentication (token claim).
 */
export class DirectAuthRequest {

    @IsNotEmpty()
    readonly username: string;

    @IsNotEmpty()
    readonly password: string;

    constructor(request: Request) {
        this.username = request.body?.username;
        this.password = request.body?.password;
    }
}

/**
 * Token claim response model.
 */
export interface DirectAuthResponse {

    jwt: string;
}
