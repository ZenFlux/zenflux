/**
 * Generates a new error instance with additional metadata and optional cause.
 *
 * @param {string} message - The error message to be associated with the error.
 * @param {Object} meta - Additional metadata to include in the error.
 * @param {Error} [cause] - An optional error that caused this error.
 *
 * @return {Error} A new error instance encapsulating the message, metadata, and optionally a cause.
 */
export class ErrorWithMeta extends Error {
    constructor(message: any, meta: any, cause?: any);
    meta: {};
}
