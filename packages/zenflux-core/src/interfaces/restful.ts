export type TErrorHandlerCallbackType = ( data: any ) => boolean;

export type TResponseFilterCallbackType = ( text: string ) => string;

export type TResponseHandlerCallbackType = ( text: string) => boolean;

export type TPossibleHandlersType = TErrorHandlerCallbackType | TResponseFilterCallbackType | TResponseHandlerCallbackType;

export enum E_RESPONSE_HANDLER_TYPE {
    ERROR_HANDLER = "error_handler",
    RESPONSE_FILTER = "response_filter",
    RESPONSE_HANDLER = "response_handler",
};

export enum E_HTTP_METHOD_TYPE {
    DELETE = "DELETE",  // Delete.
    GET = "GET",        // Read.
    OPTIONS = "OPTIONS",// Options about the request
    PATCH = "PATCH",    // Update/Modify.
    POST = "POST",      // Create.
    PUT = "PUT",        // Update/Replace.
    "__EMPTY__" = ""
};
