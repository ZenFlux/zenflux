"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHostTransitionStatus = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_fiber_new_context_1 = require("@zenflux/react-reconciler/src/react-fiber-new-context");
var react_fiber_host_context_1 = require("@zenflux/react-reconciler/src/react-fiber-host-context");
function useHostTransitionStatus() {
    if (!(react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions)) {
        throw new Error("Not implemented.");
    }
    var status = (0, react_fiber_new_context_1.readContext)(react_fiber_host_context_1.HostTransitionContext);
    return status !== null ? status : globalThis.__RECONCILER__CONFIG__.NotPendingTransition;
}
exports.useHostTransitionStatus = useHostTransitionStatus;
