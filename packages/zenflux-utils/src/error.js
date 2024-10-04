import * as util from "node:util";

/**
 * Generates a new error instance with additional metadata and optional cause.
 *
 * @param {string} message - The error message to be associated with the error.
 * @param {Object} meta - Additional metadata to include in the error.
 * @param {Error} [cause] - An optional error that caused this error.
 *
 * @return {Error} A new error instance encapsulating the message, metadata, and optionally a cause.
 */
class ErrorWithMeta extends Error {
    meta = {};

    constructor( message, meta, cause = undefined ) {
        // Util.inspect options to ensure the formatting matches your desired output
        const inspectOptions = {
            depth: null,
            maxArrayLength: null,
            breakLength: 80, // Adjust according to your needs
            compact: false,
            sorted: true,
        };

        // Formatted metadata
        let formattedMeta = util.inspect( meta, inspectOptions );

        // Add spaces to each new line in the metadata string
        formattedMeta = formattedMeta.split( '\n' ).map( ( line, index ) => {
            return index === 0 ? line : '    ' + line;
        } ).join( '\n' );

        super( `${ message }, meta:\x1b[0m -> ${ formattedMeta }`, cause ?? { cause } );

        this.meta = meta;

        // Some error may come from another context, so we need to add the stack trace.
        if ( ! ( cause instanceof Error ) && cause.stack ) {
            this.stack += `\nCaused by: ${ cause.stack }`;
        }
    }
}

export { ErrorWithMeta };
