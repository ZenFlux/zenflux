/**
 * The `Http` class provides a simple wrapper for the Fetch API.
 *
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { E_HTTP_METHOD_TYPE } from "../interfaces";

import { ObjectBase } from "../bases/object-base";

import type {
    ILogger,
    TErrorHandlerCallbackType,
    TResponseFilterCallbackType,
    TResponseHandlerCallbackType
} from "../interfaces";

// noinspection ExceptionCaughtLocallyJS

export class Http extends ObjectBase {
    private readonly logger: ILogger;
    private readonly apiBaseUrl: string;
    private readonly requestInit: RequestInit;

    private errorHandler?: TErrorHandlerCallbackType = undefined;
    private responseFilter?: TResponseFilterCallbackType = undefined;
    private responseHandler?: TResponseHandlerCallbackType = undefined;

    public static getName(): string {
        return "ZenFlux/Core/Clients/Http";
    }

    /**
     * Initializes the base class and sets up configuration parameters.
     */
    public constructor( apiBaseUrl = "http://localhost", requestInit: RequestInit = { "credentials": "include" } ) {
        super();

        this.logger = new zCore.classes.Logger( Http );

        this.logger.startsWith( this.constructor, { apiBaseUrl } );

        this.apiBaseUrl = apiBaseUrl + "/";
        this.requestInit = requestInit;
    }

    /**
     * Fetches data from the specified path using the given HTTP method and optional request body.
     */
    public async fetch( path: string, method: E_HTTP_METHOD_TYPE, body: any = {} ) {
        this.logger.startsWith( this.constructor, { path, method, body } );

        const params = Object.assign( {}, this.requestInit );
        const headers = {};

        if ( method === E_HTTP_METHOD_TYPE.GET ) {
            Object.assign( params, { headers } );
        } else {
            Object.assign( headers, { "Content-Type": "application/json" } );
            Object.assign( params, {
                method,
                headers: headers,
                body: JSON.stringify( body ),
            } );
        }

        const fetchPromise = globalThis.fetch( this.apiBaseUrl + path, params );

        let response = await fetchPromise;

        if ( ! response ) {
            return false;
        }

        let data = undefined;

        try {
            if ( ! response.ok ) {
                throw new Error( response.statusText );
            }

            let responseText = await response.text();

            responseText = this.applyResponseFilter( responseText );

            // TODO: Currently support JSON and plain text.
            if ( response.headers?.get( "Content-Type" )?.includes( "application/json" ) ) {
                data = JSON.parse( responseText );
            } else {
                data = responseText;
            }

            if ( this.applyResponseHandler( data ) ) {
                return false;
            }
        } catch ( e ) {
            if ( this.applyErrorHandler( e ) ) {
                return false;
            }

            await Promise.reject( e );
        }

        this.logger.drop( this.fetch, { path }, data );

        return data;
    }

    /**
     * Sets the error handler callback for handling errors during fetch requests.
     */
    public setErrorHandler( callback: TErrorHandlerCallbackType ) {
        if ( this.errorHandler ) {
            throw new Error( "Error handler already set." );
        }

        this.errorHandler = callback;
    }

    /**
     * Sets the response filter callback for filtering the response text.
     */
    public setResponseFilter( callback: TResponseFilterCallbackType ) {
        if ( this.responseFilter ) {
            throw new Error( "Response filter already set." );
        }

        this.responseFilter = callback;
    }

    /**
     * Sets the response handler callback for handling the response data.
     */
    public setResponseHandler( callback: TResponseHandlerCallbackType ) {
        if ( this.responseHandler ) {
            throw new Error( "Response handler already set." );
        }

        this.responseHandler = callback;
    }

    private applyErrorHandler( error: any ) {
        return !! this.errorHandler && this.errorHandler( error );
    }

    private applyResponseFilter( text: string ) {
        return ( this.responseFilter && this.responseFilter( text ) ) || text;
    }

    private applyResponseHandler( text: string ) {
        return !! this.responseHandler && this.responseHandler( text );
    }
}
