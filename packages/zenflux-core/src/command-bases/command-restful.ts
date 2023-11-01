/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description Each rest command should represent a final REST endpoint.
 */
import { CommandBase } from "@z-core/command-bases/command-base";

import { ForceMethodImplementation } from "@z-core/errors";

import * as managers from "@z-core/managers/export";

export abstract class CommandRestful extends CommandBase {
    public static getName() {
        return "ZenFlux/Core/CommandBases/CommandRestful";
    }

    /**
     * Override this method is required to determine endpoint and magic query params.
     *
     * @example
     * ```
     * args = { query: { id: 1 }  };
     * getEndpoint() = '/api/v1/users/{id}';
     * result = '/api/v1/users/1';
     * ```
     */
    public getEndpoint(): string {
        throw new ForceMethodImplementation( this, "getEndpoint" );
    }

    protected apply( args = this.args, options = this.options ) {// eslint-disable-line @typescript-eslint/no-unused-vars
        const endpoint = this.applyEndpointFormat( this.getEndpoint(), args );

        return managers.restful.getClient().fetch(
            endpoint, managers.restful.currentHttpMethod,
            args || null
        );
    }

    private applyEndpointFormat( endpoint: string, data: any = {} ): string {
        // Replace query with `magic` placeholders.
        if ( endpoint.includes( "{" ) ) {
            endpoint = endpoint.split( "/" ).map( ( endpointPart ) => {
                const match = endpointPart.match( "\\{(.*?)\\}" );

                if ( match?.length && "undefined" !== typeof data[ match[ 1 ] ] ) {
                    return data[ match[ 1 ] ];
                }

                return endpointPart;
            } ).join( "/" );
        }

        return endpoint;
    }
}
