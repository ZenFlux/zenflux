/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description Responsible for manging restful commands which are wrappers for HTTP requests.
 */
import { Commands } from "@z-core/managers/commands";

import { Http } from "@z-core/clients/http";

import {
    E_RESPONSE_HANDLER_TYPE,
    E_HTTP_METHOD_TYPE
} from "@z-core/interfaces";

import type { CommandRestful } from "@z-core/command-bases";

import type {
    IAPIConfig,
    ICommandArgsInterface,
    ICommandOptionsInterface,

    TErrorHandlerCallbackType,
    TPossibleHandlersType,
    TResponseFilterCallbackType,
    TResponseHandlerCallbackType
} from "@z-core/interfaces";

export class Restful extends Commands {
    private static client: Http;

    public currentHttpMethod: E_HTTP_METHOD_TYPE;

    public static getName() {
        return "ZenFlux/Core/Managers/Restful";
    }

    public constructor( Config: IAPIConfig ) {
        super();

        Restful.client = new Http( Config.baseURL, Config.requestInit );
    }

    public getClient() {
        return Restful.client;
    }

    public get( command: string, args: ICommandArgsInterface = {}, options: ICommandOptionsInterface = {} ) {
        this.currentHttpMethod = E_HTTP_METHOD_TYPE.GET;

        return super.run( command, args, options );
    }

    public update( command: string, args: ICommandArgsInterface = {}, options: {} = {} ) {
        this.currentHttpMethod = E_HTTP_METHOD_TYPE.PATCH;

        return super.run( command, args, options );
    }

    public delete( command: string, args: ICommandArgsInterface = {}, options: {} = {} ) {
        this.currentHttpMethod = E_HTTP_METHOD_TYPE.DELETE;

        return super.run( command, args, options );
    }

    public create( command: string, args: ICommandArgsInterface = {}, options: {} = {} ) {
        this.currentHttpMethod = E_HTTP_METHOD_TYPE.POST;

        return super.run( command, args, options );
    }

    protected async runInstance( command: CommandRestful, args: ICommandArgsInterface = {}, options: {} = {} ) {
        if ( ! this.currentHttpMethod ) {
            throw new Error( "Cannot run directly use one of the http methods: \"get\", \"update\", \"delete, \"create" );
        }

        // New args.
        const newArgs = {
            type: this.currentHttpMethod,
            args: {
                query: {},
                data: {},
            },
        };

        if ( E_HTTP_METHOD_TYPE.GET === this.currentHttpMethod ) {
            newArgs.args.query = args;
        } else {
            newArgs.args.data = args;
        }

        args.result = await super.runInstance( command, newArgs, options );

        // Clear method type.
        this.currentHttpMethod = E_HTTP_METHOD_TYPE.__EMPTY__;

        return args.result;
    }

    /**
     * Handlers on return true will swallow the request.
     */
    public setHandler( type: E_RESPONSE_HANDLER_TYPE, callback: TPossibleHandlersType ) {
        switch ( type ) {
            case E_RESPONSE_HANDLER_TYPE.ERROR_HANDLER:
                Restful.client.setErrorHandler( callback as TErrorHandlerCallbackType );
                break;
            case E_RESPONSE_HANDLER_TYPE.RESPONSE_FILTER:
                Restful.client.setResponseFilter( callback as TResponseFilterCallbackType );
                break;
            case E_RESPONSE_HANDLER_TYPE.RESPONSE_HANDLER:
                Restful.client.setResponseHandler( callback as TResponseHandlerCallbackType );
                break;

            default:
                throw new Error( `Unknown handler type: '${ type }'` );
        }
    }
}
