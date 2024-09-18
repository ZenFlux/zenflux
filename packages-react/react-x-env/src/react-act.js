"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.act = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// eslint-disable-next-line no-restricted-imports
require("./env");
// eslint-disable-next-line import/order
var enquque_task_1 = require("@zenflux/react-shared/src/enquque-task");
// `act` calls can be nested, so we track the depth. This represents the
// number of `act` scopes on the stack.
var actScopeDepth = 0;
// We only warn the first time you neglect to await an async `act` scope.
var didWarnNoAwaitAct = false;
function act(callback) {
    var ReactCurrentActQueue = global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentActQueue;
    if (__DEV__) {
        // When ReactCurrentActQueue.current is not null, it signals to React that
        // we're currently inside an `act` scope. React will push all its tasks to
        // this queue instead of scheduling them with platform APIs.
        //
        // We set this to an empty array when we first enter an `act` scope, and
        // only unset it once we've left the outermost `act` scope — remember that
        // `act` calls can be nested.
        //
        // If we're already inside an `act` scope, reuse the existing queue.
        var prevIsBatchingLegacy = ReactCurrentActQueue.isBatchingLegacy;
        var prevActQueue_1 = ReactCurrentActQueue.current;
        var prevActScopeDepth_1 = actScopeDepth;
        actScopeDepth++;
        var queue_1 = (ReactCurrentActQueue.current =
            prevActQueue_1 !== null ? prevActQueue_1 : []);
        // Used to reproduce behavior of `batchedUpdates` in legacy mode. Only
        // set to `true` while the given callback is executed, not for updates
        // triggered during an async event, because this is how the legacy
        // implementation of `act` behaved.
        ReactCurrentActQueue.isBatchingLegacy = true;
        var result = void 0;
        // This tracks whether the `act` call is awaited. In certain cases, not
        // awaiting it is a mistake, so we will detect that and warn.
        var didAwaitActCall_1 = false;
        try {
            // Reset this to `false` right before entering the React work loop. The
            // only place we ever read this fields is just below, right after running
            // the callback. So we don't need to reset after the callback runs.
            ReactCurrentActQueue.didScheduleLegacyUpdate = false;
            result = callback();
            var didScheduleLegacyUpdate = ReactCurrentActQueue.didScheduleLegacyUpdate;
            // Replicate behavior of original `act` implementation in legacy mode,
            // which flushed updates immediately after the scope function exits, even
            // if it's an async function.
            if (!prevIsBatchingLegacy && didScheduleLegacyUpdate) {
                flushActQueue(queue_1);
            }
            // `isBatchingLegacy` gets reset using the regular stack, not the async
            // one used to track `act` scopes. Why, you may be wondering? Because
            // that's how it worked before version 18. Yes, it's confusing! We should
            // delete legacy mode!!
            ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
        }
        catch (error) {
            // `isBatchingLegacy` gets reset using the regular stack, not the async
            // one used to track `act` scopes. Why, you may be wondering? Because
            // that's how it worked before version 18. Yes, it's confusing! We should
            // delete legacy mode!!
            ReactCurrentActQueue.isBatchingLegacy = prevIsBatchingLegacy;
            popActScope(prevActQueue_1, prevActScopeDepth_1);
            throw error;
        }
        if (result !== null &&
            typeof result === "object" &&
            // $FlowFixMe[method-unbinding]
            typeof result.then === "function") {
            // A promise/thenable was returned from the callback. Wait for it to
            // resolve before flushing the queue.
            //
            // If `act` were implemented as an async function, this whole block could
            // be a single `await` call. That's really the only difference between
            // this branch and the next one.
            var thenable_1 = result;
            // Warn if the an `act` call with an async scope is not awaited. In a
            // future release, consider making this an error.
            queueSeveralMicrotasks(function () {
                if (!didAwaitActCall_1 && !didWarnNoAwaitAct) {
                    didWarnNoAwaitAct = true;
                    console.error("You called act(async () => ...) without await. " +
                        "This could lead to unexpected testing behaviour, " +
                        "interleaving multiple act calls and mixing their " +
                        "scopes. " +
                        "You should - await act(async () => ...);");
                }
            });
            return {
                then: function (resolve, reject) {
                    didAwaitActCall_1 = true;
                    thenable_1.then(function (returnValue) {
                        popActScope(prevActQueue_1, prevActScopeDepth_1);
                        if (prevActScopeDepth_1 === 0) {
                            // We're exiting the outermost `act` scope. Flush the queue.
                            try {
                                flushActQueue(queue_1);
                                (0, enquque_task_1.default)(function () {
                                    // Recursively flush tasks scheduled by a microtask.
                                    return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                                });
                            }
                            catch (error) {
                                // `thenable` might not be a real promise, and `flushActQueue`
                                // might throw, so we need to wrap `flushActQueue` in a
                                // try/catch.
                                reject(error);
                            }
                        }
                        else {
                            resolve(returnValue);
                        }
                    }, function (error) {
                        popActScope(prevActQueue_1, prevActScopeDepth_1);
                        reject(error);
                    });
                },
            };
        }
        else {
            var returnValue_1 = result;
            // The callback is not an async function. Exit the current
            // scope immediately.
            popActScope(prevActQueue_1, prevActScopeDepth_1);
            if (prevActScopeDepth_1 === 0) {
                // We're exiting the outermost `act` scope. Flush the queue.
                flushActQueue(queue_1);
                // If the queue is not empty, it implies that we intentionally yielded
                // to the main thread, because something suspended. We will continue
                // in an asynchronous task.
                //
                // Warn if something suspends but the `act` call is not awaited.
                // In a future release, consider making this an error.
                if (queue_1.length !== 0) {
                    queueSeveralMicrotasks(function () {
                        if (!didAwaitActCall_1 && !didWarnNoAwaitAct) {
                            didWarnNoAwaitAct = true;
                            console.error("A component suspended inside an `act` scope, but the " +
                                "`act` call was not awaited. When testing React " +
                                "components that depend on asynchronous data, you must " +
                                "await the result:\n\n" +
                                "await act(() => ...)");
                        }
                    });
                }
                // Like many things in this module, this is next part is confusing.
                //
                // We do not currently require every `act` call that is passed a
                // callback to be awaited, through arguably we should. Since this
                // callback was synchronous, we need to exit the current scope before
                // returning.
                //
                // However, if thenable we're about to return *is* awaited, we'll
                // immediately restore the current scope. So it shouldn't observable.
                //
                // This doesn't affect the case where the scope callback is async,
                // because we always require those calls to be awaited.
                //
                // TODO: In a future version, consider always requiring all `act` calls
                // to be awaited, regardless of whether the callback is sync or async.
                ReactCurrentActQueue.current = null;
            }
            return {
                then: function (resolve, reject) {
                    didAwaitActCall_1 = true;
                    if (prevActScopeDepth_1 === 0) {
                        // If the `act` call is awaited, restore the queue we were
                        // using before (see long comment above) so we can flush it.
                        ReactCurrentActQueue.current = queue_1;
                        (0, enquque_task_1.default)(function () {
                            // Recursively flush tasks scheduled by a microtask.
                            return recursivelyFlushAsyncActWork(returnValue_1, resolve, reject);
                        });
                    }
                    else {
                        resolve(returnValue_1);
                    }
                },
            };
        }
    }
    else {
        throw new Error("act(...) is not supported in production builds of React.");
    }
}
exports.act = act;
function popActScope(prevActQueue, prevActScopeDepth) {
    if (__DEV__) {
        if (prevActScopeDepth !== actScopeDepth - 1) {
            console.error("You seem to have overlapping act() calls, this is not supported. " +
                "Be sure to await previous act() calls before making a new one. ");
        }
        actScopeDepth = prevActScopeDepth;
    }
}
function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
    if (__DEV__) {
        var ReactCurrentActQueue = global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentActQueue;
        // Check if any tasks were scheduled asynchronously.
        var queue = ReactCurrentActQueue.current;
        if (queue !== null) {
            if (queue.length !== 0) {
                // Async tasks were scheduled, mostly likely in a microtask.
                // Keep flushing until there are no more.
                try {
                    flushActQueue(queue);
                    // The work we just performed may have schedule additional async
                    // tasks. Wait a macrotask and check again.
                    (0, enquque_task_1.default)(function () {
                        return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                    });
                }
                catch (error) {
                    // Leave remaining tasks on the queue if something throws.
                    reject(error);
                }
            }
            else {
                // The queue is empty. We can finish.
                ReactCurrentActQueue.current = null;
                resolve(returnValue);
            }
        }
        else {
            resolve(returnValue);
        }
    }
}
var isFlushing = false;
function flushActQueue(queue) {
    if (__DEV__) {
        if (!isFlushing) {
            // Prevent re-entrance.
            isFlushing = true;
            var i = 0;
            try {
                for (; i < queue.length; i++) {
                    var callback = queue[i];
                    do {
                        var ReactCurrentActQueue = global.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentActQueue;
                        ReactCurrentActQueue.didUsePromise = false;
                        var continuation = callback(false);
                        if (continuation !== null) {
                            if (ReactCurrentActQueue.didUsePromise) {
                                // The component just suspended. Yield to the main thread in
                                // case the promise is already resolved. If so, it will ping in
                                // a microtask and we can resume without unwinding the stack.
                                queue[i] = callback;
                                queue.splice(0, i);
                                return;
                            }
                            callback = continuation;
                        }
                        else {
                            break;
                        }
                    } while (true);
                }
                // We flushed the entire queue.
                queue.length = 0;
            }
            catch (error) {
                // If something throws, leave the remaining callbacks on the queue.
                queue.splice(0, i + 1);
                throw error;
            }
            finally {
                isFlushing = false;
            }
        }
    }
}
// Some of our warnings attempt to detect if the `act` call is awaited by
// checking in an asynchronous task. Wait a few microtasks before checking. The
// only reason one isn't sufficient is we want to accommodate the case where an
// `act` call is returned from an async function without first being awaited,
// since that's a somewhat common pattern. If you do this too many times in a
// nested sequence, you might get a warning, but you can always fix by awaiting
// the call.
//
// A macrotask would also work (and is the fallback) but depending on the test
// environment it may cause the warning to fire too late.
var queueSeveralMicrotasks = typeof queueMicrotask === "function"
    ? function (callback) {
        queueMicrotask(function () { return queueMicrotask(callback); });
    }
    : enquque_task_1.default;
