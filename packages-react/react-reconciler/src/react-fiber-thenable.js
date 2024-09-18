"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIfUseWrappedInAsyncCatch = exports.checkIfUseWrappedInTryCatch = exports.getSuspendedThenable = exports.suspendCommit = exports.trackUsedThenable = exports.isThenableResolved = exports.createThenableState = exports.noopSuspenseyCommitThenable = exports.SuspenseyCommitException = exports.SuspenseException = void 0;
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_fiber_work_in_progress_1 = require("@zenflux/react-reconciler/src/react-fiber-work-in-progress");
var ReactCurrentActQueue = react_shared_internals_1.default.ReactCurrentActQueue;
// An error that is thrown (e.g. by `use`) to trigger Suspense. If we
// detect this is caught by userspace, we'll log a warning in development.
exports.SuspenseException = new Error("Suspense Exception: This is not a real error! It's an implementation " + "detail of `use` to interrupt the current render. You must either " + "rethrow it immediately, or move the `use` call outside of the " + "`try/catch` block. Capturing without rethrowing will lead to " + "unexpected behavior.\n\n" + "To handle async errors, wrap your component in an error boundary, or " + "call the promise's `.catch` method and pass the result to `use`");
exports.SuspenseyCommitException = new Error("Suspense Exception: This is not a real error, and should not leak into " + "userspace. If you're seeing this, it's likely a bug in React.");
// This is a noop thenable that we use to trigger a fallback in throwException.
// TODO: It would be better to refactor throwException into multiple functions
// so we can trigger a fallback directly without having to check the type. But
// for now this will do.
exports.noopSuspenseyCommitThenable = {
    then: function () {
        if (__DEV__) {
            console.error("Internal React error: A listener was unexpectedly attached to a " + "\"noop\" thenable. This is a bug in React. Please file an issue.");
        }
    }
};
function createThenableState() {
    // The ThenableState is created the first time a component suspends. If it
    // suspends again, we'll reuse the same state.
    return [];
}
exports.createThenableState = createThenableState;
function isThenableResolved(thenable) {
    var status = thenable.status;
    return status === "fulfilled" || status === "rejected";
}
exports.isThenableResolved = isThenableResolved;
function noop() {
}
function trackUsedThenable(thenableState, thenable, index) {
    if (__DEV__ && ReactCurrentActQueue.current !== null) {
        ReactCurrentActQueue.didUsePromise = true;
    }
    var previous = thenableState[index];
    if (previous === undefined) {
        thenableState.push(thenable);
    }
    else {
        if (previous !== thenable) {
            // Reuse the previous thenable, and drop the new one. We can assume
            // they represent the same value, because components are idempotent.
            // Avoid an unhandled rejection errors for the Promises that we'll
            // intentionally ignore.
            thenable.then(noop, noop);
            thenable = previous;
        }
    }
    // We use an expando to track the status and result of a thenable so that we
    // can synchronously unwrap the value. Think of this as an extension of the
    // Promise API, or a custom interface that is a superset of Thenable.
    //
    // If the thenable doesn't have a status, set it to "pending" and attach
    // a listener that will update its status and result when it resolves.
    switch (thenable.status) {
        case "fulfilled": {
            return thenable.value;
        }
        case "rejected": {
            var rejectedError = thenable.reason;
            checkIfUseWrappedInAsyncCatch(rejectedError);
            throw rejectedError;
        }
        default: {
            if (typeof thenable.status === "string") {
                // Only instrument the thenable if the status if not defined. If
                // it's defined, but an unknown value, assume it's been instrumented by
                // some custom userspace implementation. We treat it as "pending".
                // Attach a dummy listener, to ensure that any lazy initialization can
                // happen. Flight lazily parses JSON when the value is actually awaited.
                thenable.then(noop, noop);
            }
            else {
                // This is an uncached thenable that we haven't seen before.
                // Detect infinite ping loops caused by uncached promises.
                var root = (0, react_fiber_work_in_progress_1.getWorkInProgressRoot)();
                if (root !== null && root.shellSuspendCounter > 100) {
                    // This root has suspended repeatedly in the shell without making any
                    // progress (i.e. committing something). This is highly suggestive of
                    // an infinite ping loop, often caused by an accidental Async Client
                    // Component.
                    //
                    // During a transition, we can suspend the work loop until the promise
                    // to resolve, but this is a sync render, so that's not an option. We
                    // also can't show a fallback, because none was provided. So our last
                    // resort is to throw an error.
                    //
                    // TODO: Remove this error in a future release. Other ways of handling
                    // this case include forcing a concurrent render, or putting the whole
                    // root into offscreen mode.
                    throw new Error("async/await is not yet supported in Client Components, only " + "Server Components. This error is often caused by accidentally " + "adding `'use client'` to a module that was originally written " + "for the server.");
                }
                var pendingThenable = thenable;
                pendingThenable.status = "pending";
                pendingThenable.then(function (fulfilledValue) {
                    if (thenable.status === "pending") {
                        var fulfilledThenable = thenable;
                        fulfilledThenable.status = "fulfilled";
                        fulfilledThenable.value = fulfilledValue;
                    }
                }, function (error) {
                    if (thenable.status === "pending") {
                        var rejectedThenable = thenable;
                        rejectedThenable.status = "rejected";
                        rejectedThenable.reason = error;
                    }
                });
                // Check one more time in case the thenable resolved synchronously.
                // @ts-ignore
                switch (thenable.status) {
                    case "fulfilled": {
                        var fulfilledThenable = thenable;
                        return fulfilledThenable.value;
                    }
                    case "rejected": {
                        var rejectedThenable = thenable;
                        var rejectedError = rejectedThenable.reason;
                        checkIfUseWrappedInAsyncCatch(rejectedError);
                        throw rejectedError;
                    }
                }
            }
            // Suspend.
            //
            // Throwing here is an implementation detail that allows us to unwind the
            // call stack. But we shouldn't allow it to leak into userspace. Throw an
            // opaque placeholder value instead of the actual thenable. If it doesn't
            // get captured by the work loop, log a warning, because that means
            // something in userspace must have caught it.
            suspendedThenable = thenable;
            if (__DEV__) {
                needsToResetSuspendedThenableDEV = true;
            }
            throw exports.SuspenseException;
        }
    }
}
exports.trackUsedThenable = trackUsedThenable;
function suspendCommit() {
    // This extra indirection only exists so it can handle passing
    // noopSuspenseyCommitThenable through to throwException.
    // TODO: Factor the thenable check out of throwException
    suspendedThenable = exports.noopSuspenseyCommitThenable;
    throw exports.SuspenseyCommitException;
}
exports.suspendCommit = suspendCommit;
// This is used to track the actual thenable that suspended so it can be
// passed to the rest of the Suspense implementation — which, for historical
// reasons, expects to receive a thenable.
var suspendedThenable = null;
var needsToResetSuspendedThenableDEV = false;
function getSuspendedThenable() {
    // This is called right after `use` suspends by throwing an exception. `use`
    // throws an opaque value instead of the thenable itself so that it can't be
    // caught in userspace. Then the work loop accesses the actual thenable using
    // this function.
    if (suspendedThenable === null) {
        throw new Error("Expected a suspended thenable. This is a bug in React. Please file " + "an issue.");
    }
    var thenable = suspendedThenable;
    suspendedThenable = null;
    if (__DEV__) {
        needsToResetSuspendedThenableDEV = false;
    }
    return thenable;
}
exports.getSuspendedThenable = getSuspendedThenable;
function checkIfUseWrappedInTryCatch() {
    if (__DEV__) {
        // This was set right before SuspenseException was thrown, and it should
        // have been cleared when the exception was handled. If it wasn't,
        // it must have been caught by userspace.
        if (needsToResetSuspendedThenableDEV) {
            needsToResetSuspendedThenableDEV = false;
            return true;
        }
    }
    return false;
}
exports.checkIfUseWrappedInTryCatch = checkIfUseWrappedInTryCatch;
function checkIfUseWrappedInAsyncCatch(rejectedReason) {
    // This check runs in prod, too, because it prevents a more confusing
    // downstream error, where SuspenseException is caught by a promise and
    // thrown asynchronously.
    // TODO: Another way to prevent SuspenseException from leaking into an async
    // execution context is to check the dispatcher every time `use` is called,
    // or some equivalent. That might be preferable for other reasons, too, since
    // it matches how we prevent similar mistakes for other hooks.
    if (rejectedReason === exports.SuspenseException) {
        throw new Error("Hooks are not supported inside an async component. This " + "error is often caused by accidentally adding `'use client'` " + "to a module that was originally written for the server.");
    }
}
exports.checkIfUseWrappedInAsyncCatch = checkIfUseWrappedInAsyncCatch;
