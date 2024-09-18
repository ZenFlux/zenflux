"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isConcurrentActEnvironment = exports.isLegacyActEnvironment = void 0;
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var warnsIfNotActing = globalThis.__RECONCILER__CONFIG__.warnsIfNotActing;
var ReactCurrentActQueue = react_shared_internals_1.default.ReactCurrentActQueue;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isLegacyActEnvironment(fiber) {
    if (__DEV__) {
        // Legacy mode. We preserve the behavior of React 17's act. It assumes an
        // act environment whenever `jest` is defined, but you can still turn off
        // spurious warnings by setting IS_REACT_ACT_ENVIRONMENT explicitly
        // to false.
        var isReactActEnvironmentGlobal = // $FlowFixMe[cannot-resolve-name] Flow doesn't know about IS_REACT_ACT_ENVIRONMENT global
         typeof IS_REACT_ACT_ENVIRONMENT !== "undefined" ? // $FlowFixMe[cannot-resolve-name]
            IS_REACT_ACT_ENVIRONMENT : undefined;
        // @ts-ignore
        var jestIsDefined = typeof jest !== "undefined";
        return warnsIfNotActing && jestIsDefined && isReactActEnvironmentGlobal !== false;
    }
    return false;
}
exports.isLegacyActEnvironment = isLegacyActEnvironment;
function isConcurrentActEnvironment() {
    if (__DEV__) {
        var isReactActEnvironmentGlobal = // $FlowFixMe[cannot-resolve-name] Flow doesn't know about IS_REACT_ACT_ENVIRONMENT global
         typeof IS_REACT_ACT_ENVIRONMENT !== "undefined" ? // $FlowFixMe[cannot-resolve-name]
            IS_REACT_ACT_ENVIRONMENT : undefined;
        if (!isReactActEnvironmentGlobal && ReactCurrentActQueue.current !== null) {
            // TODO: Include link to relevant documentation page.
            console.error("The current testing environment is not configured to support " + "act(...)");
        }
        return isReactActEnvironmentGlobal;
    }
    return false;
}
exports.isConcurrentActEnvironment = isConcurrentActEnvironment;
