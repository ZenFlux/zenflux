export function zCreateResolvablePromise(name?: string, autoThrow?: boolean): {
    promise: Promise<any>;
    resolve: Function;
    reject: Function;
    await: Promise<any>;
    isPending: boolean;
    isRejected: boolean;
    isFulfilled: boolean;
    then: typeof ThenSynthetic;
    catch: typeof CatchSynthetic;
    finally: typeof FinallySynthetic;
};
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
declare function ThenSynthetic<T, TResult1, TResult2>(name: string, onfulfilled?: ((arg0: T) => (TResult1 | PromiseLike<TResult1>)) | undefined, onrejected?: ((arg0: any) => (TResult2 | PromiseLike<TResult2>)) | undefined): Promise<TResult1 | TResult2>;
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
declare function CatchSynthetic<T, TResult>(name: string, onrejected?: ((arg0: any) => (TResult | PromiseLike<TResult>)) | undefined): Promise<T | TResult>;
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
declare function FinallySynthetic<T>(name: string, onfinally?: (() => void) | undefined): Promise<T>;
export {};
