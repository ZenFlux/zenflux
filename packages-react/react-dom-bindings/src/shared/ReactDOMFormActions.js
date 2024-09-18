"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFormState = exports.useFormStatus = exports.NotPending = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var ReactCurrentDispatcher = react_shared_internals_1.default.ReactCurrentDispatcher;
// Since the "not pending" value is always the same, we can reuse the
// same object across all transitions.
var sharedNotPendingObject = {
    pending: false,
    data: null,
    method: null,
    action: null
};
// @ts-ignore
exports.NotPending = __DEV__ ? Object.freeze(sharedNotPendingObject) : sharedNotPendingObject;
function resolveDispatcher() {
    // Copied from react/src/ReactHooks.js. It's the same thing but in a
    // different package.
    var dispatcher = ReactCurrentDispatcher.current;
    if (__DEV__) {
        if (dispatcher === null) {
            console.error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for" + " one of the following reasons:\n" + "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" + "2. You might be breaking the Rules of Hooks\n" + "3. You might have more than one copy of React in the same app\n" + "See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
        }
    }
    // Will result in a null access error if accessed outside render phase. We
    // intentionally don't throw our own error because this is in a hot path.
    // Also helps ensure this is inlined.
    return dispatcher;
}
function useFormStatus() {
    if (!(react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions)) {
        throw new Error("Not implemented.");
    }
    else {
        var dispatcher = resolveDispatcher();
        // $FlowFixMe[not-a-function] We know this exists because of the feature check above.
        // @ts-ignore
        return dispatcher.useHostTransitionStatus();
    }
}
exports.useFormStatus = useFormStatus;
function useFormState(action, initialState, permalink) {
    if (!(react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions)) {
        throw new Error("Not implemented.");
    }
    else {
        var dispatcher = resolveDispatcher();
        // $FlowFixMe[not-a-function] This is unstable, thus optional
        // @ts-ignore
        return dispatcher.useFormState(action, initialState, permalink);
    }
}
exports.useFormState = useFormState;
