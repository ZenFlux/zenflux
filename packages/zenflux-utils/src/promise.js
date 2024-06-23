/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */

/**
 * Create a promise that can be resolved from outside.
 *
 * @return {{
 *     promise: Promise,
 *     resolve: Function,
 *     reject: Function,
 *     isPending: boolean,
 *     isRejected: boolean,
 *     isFulfilled: boolean,
 *     await: Promise
 * }}
 */
export const zCreateResolvablePromise = () => {
    const result = {};

    result.promise = new Promise( ( resolve, reject ) => {
        result.resolve = resolve;
        result.reject = reject;
    } );

    // Alias.
    result.await = result.promise;

    // State
    result.isPending = true;
    result.isRejected = false;
    result.isFulfilled = false;

    // Attach state changers.
    result.promise.then(
        function ( v ) {
            result.isFulfilled = true;
            result.isPending = false;
            return v;
        },
        function ( e ) {
            result.isRejected = true;
            result.isFulfilled = false;
            throw e;
        }
    );

    return result;
};
