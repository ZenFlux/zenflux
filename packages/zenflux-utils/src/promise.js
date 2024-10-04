/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */

import { debug } from "util";

/**
 * Adds fulfillment and rejection handlers to the promise,
 * and returns a new promise resolving to the return value of the called handler,
 * or to its original settled value if the promise was not handled
 * (i.e. if the relevant handler is `undefined`).
 *
 * @param {string} name - of method that use it
 * @param {function(T): (TResult1 | PromiseLike<TResult1>)=} onfulfilled - The callback to execute when
 * the Promise is resolved.
 * @param {function(any): (TResult2 | PromiseLike<TResult2>)=} onrejected - The callback to execute when
 * the Promise is rejected.
 * @returns {Promise<TResult1 | TResult2>} A Promise for the completion of
 * whichever handler is executed.
 * @template T - The type of the promise.
 * @template TResult1 - The type of the value returned from onfulfilled, or the state of the promise returned from onfulfilled.
 * @template TResult2 - The type of the value returned from onrejected, or the state of the promise returned from onrejected.
 */
function ThenSynthetic( name, onfulfilled, onrejected ) {
};

/**
 * Adds a rejection handler callback to the promise, and returns a new promise
 * that is resolved to the return value of the callback if it is called,
 * or to its original settled value if the promise is fulfilled.
 *
 * @param {string} name - of method that use it
 * @param {function(any): (TResult | PromiseLike<TResult>)=} onrejected - The callback to execute when
 * the Promise is rejected.
 * @returns {Promise<T | TResult>} A Promise for the completion of
 * the rejection handler.
 * @template T - The type of the promise.
 * @template TResult - The type of the value returned from the onrejected callback,
 * or the state of the promise returned from the onrejected callback.
 */
function CatchSynthetic( name, onrejected ) {
    // Implementation here...
}

/**
 * Adds a handler to be called when the promise is settled, regardless of its outcome
 * (fulfilled or rejected). The handler does not receive the promise's result.
 * This method returns a new promise that is resolved when the original promise is resolved
 * and the final handler has completed its execution.
 *
 * @param {function(): void=} onfinally - The callback to execute when
 * the Promise is settled (fulfilled or rejected).
 * @param {string} name - of method that use it
 *
 * @returns {Promise<T>} A Promise for the completion of the finally handler.
 * @template T - The type of the promise.
 */
function FinallySynthetic( name, onfinally ) {
    // Implementation here...
}

/**
 * Create a promise that can be resolved from outside.
 *
 * @param {string} [name=""]
 * @param {boolean} [autoThrow=true]
 *
 * @return {{
 *     promise: Promise,
 *     resolve: Function,
 *     reject: Function,
 *     await: Promise;
 *     isPending: boolean,
 *     isRejected: boolean,
 *     isFulfilled: boolean,
 *     then: typeof ThenSynthetic;
 *     catch: typeof CatchSynthetic;
 *     finally: typeof FinallySynthetic;
 * }}
 */
export const zCreateResolvablePromise = ( name = "", autoThrow = true ) => {
    const result = {};

    let lastKnownSource = "unknown";

    result.promise = new Promise( ( resolve, reject ) => {
        result.resolve = resolve;
        result.reject = reject;
    } );

    // Alias.
    // TODO - Remove.
    result.await = result.promise;

    // State
    result.isPending = true;
    result.isRejected = false;
    result.isFulfilled = false;

    const validateName = ( name ) => {
    };

    result.then = function ( name, onfulfilled, onrejected ) {
        validateName( name );
        this.customName = name;
        return result.promise.then( onfulfilled, onrejected );
    }.bind( result.promise );

    result.catch = function ( name, onrejected ) {
        validateName( name );
        this.customName = name;
        return result.promise.catch( onrejected );
    }.bind( result.promise );

    result.finally = function ( name, onfinally ) {
        validateName( name );
        this.customName = name;
        return result.promise.finally( onfinally );
    }.bind( result.promise );

    // Attach state changers.
    result.promise.then(
        function ( v ) {
            result.isPending = false;

            result.isFulfilled = true;
            result.isRejected = false;

            return v;
        },
        function ( e, source ) {
            result.isPending = false;

            result.isFulfilled = false;
            result.isRejected = true;

            if ( autoThrow ) throw e;
        }
    );


    return result;
};
