"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.peekEntangledActionLane = exports.requestSyncActionContext = exports.requestAsyncActionContext = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_root_scheduler_1 = require("@zenflux/react-reconciler/src/react-fiber-root-scheduler");
// If there are multiple, concurrent async actions, they are entangled. All
// transition updates that occur while the async action is still in progress
// are treated as part of the action.
//
// The ideal behavior would be to treat each async function as an independent
// action. However, without a mechanism like AsyncContext, we can't tell which
// action an update corresponds to. So instead, we entangle them all into one.
// The listeners to notify once the entangled scope completes.
var currentEntangledListeners = null;
// The number of pending async actions in the entangled scope.
var currentEntangledPendingCount = 0;
// The transition lane shared by all updates in the entangled scope.
var currentEntangledLane = fiber_lane_constants_1.NoLane;
function requestAsyncActionContext(actionReturnValue, // If this is provided, this resulting thenable resolves to this value instead
// of the return value of the action. This is a perf trick to avoid composing
// an extra async function.
overrideReturnValue) {
    // This is an async action.
    //
    // Return a thenable that resolves once the action scope (i.e. the async
    // function passed to startTransition) has finished running.
    var thenable = actionReturnValue;
    var entangledListeners;
    if (currentEntangledListeners === null) {
        // There's no outer async action scope. Create a new one.
        entangledListeners = currentEntangledListeners = [];
        currentEntangledPendingCount = 0;
        currentEntangledLane = (0, react_fiber_root_scheduler_1.requestTransitionLane)();
    }
    else {
        entangledListeners = currentEntangledListeners;
    }
    currentEntangledPendingCount++;
    // Create a thenable that represents the result of this action, but doesn't
    // resolve until the entire entangled scope has finished.
    //
    // Expressed using promises:
    //   const [thisResult] = await Promise.all([thisAction, entangledAction]);
    //   return thisResult;
    var resultThenable = createResultThenable(entangledListeners);
    var resultStatus = "pending";
    var resultValue;
    var rejectedReason;
    thenable.then(function (value) {
        resultStatus = "fulfilled";
        resultValue = overrideReturnValue !== null ? overrideReturnValue : value;
        pingEngtangledActionScope();
    }, function (error) {
        resultStatus = "rejected";
        rejectedReason = error;
        pingEngtangledActionScope();
    });
    // Attach a listener to fill in the result.
    entangledListeners.push(function () {
        switch (resultStatus) {
            case "fulfilled": {
                var fulfilledThenable = resultThenable;
                fulfilledThenable.status = "fulfilled";
                fulfilledThenable.value = resultValue;
                break;
            }
            case "rejected": {
                var rejectedThenable = resultThenable;
                rejectedThenable.status = "rejected";
                rejectedThenable.reason = rejectedReason;
                break;
            }
            case "pending":
            default: {
                // The listener above should have been called first, so `resultStatus`
                // should already be set to the correct value.
                throw new Error("Thenable should have already resolved. This " + "is a bug in React.");
            }
        }
    });
    return resultThenable;
}
exports.requestAsyncActionContext = requestAsyncActionContext;
function requestSyncActionContext(actionReturnValue, // If this is provided, this resulting thenable resolves to this value instead
// of the return value of the action. This is a perf trick to avoid composing
// an extra async function.
overrideReturnValue) {
    var resultValue = overrideReturnValue !== null ? overrideReturnValue : actionReturnValue;
    // This is not an async action, but it may be part of an outer async action.
    if (currentEntangledListeners === null) {
        return resultValue;
    }
    else {
        // Return a thenable that does not resolve until the entangled actions
        // have finished.
        var entangledListeners = currentEntangledListeners;
        var resultThenable_1 = createResultThenable(entangledListeners);
        entangledListeners.push(function () {
            var fulfilledThenable = resultThenable_1;
            fulfilledThenable.status = "fulfilled";
            fulfilledThenable.value = resultValue;
        });
        return resultThenable_1;
    }
}
exports.requestSyncActionContext = requestSyncActionContext;
function pingEngtangledActionScope() {
    if (currentEntangledListeners !== null && --currentEntangledPendingCount === 0) {
        // All the actions have finished. Close the entangled async action scope
        // and notify all the listeners.
        var listeners = currentEntangledListeners;
        currentEntangledListeners = null;
        currentEntangledLane = fiber_lane_constants_1.NoLane;
        for (var i = 0; i < listeners.length; i++) {
            var listener = listeners[i];
            listener();
        }
    }
}
function createResultThenable(entangledListeners) {
    // Waits for the entangled async action to complete, then resolves to the
    // result of an individual action.
    var resultThenable = {
        status: "pending",
        // TODO: This is a mistake?
        // value: null,
        // reason: null,
        then: function (resolve) {
            // This is a bit of a cheat. `resolve` expects a value of type `S` to be
            // passed, but because we're instrumenting the `status` field ourselves,
            // and we know this thenable will only be used by React, we also know
            // the value isn't actually needed. So we add the resolve function
            // directly to the entangled listeners.
            //
            // This is also why we don't need to check if the thenable is still
            // pending; the Suspense implementation already performs that check.
            var ping = resolve;
            entangledListeners.push(ping);
        }
    };
    return resultThenable;
}
function peekEntangledActionLane() {
    return currentEntangledLane;
}
exports.peekEntangledActionLane = peekEntangledActionLane;
