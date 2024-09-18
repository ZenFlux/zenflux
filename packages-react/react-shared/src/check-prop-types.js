"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 *
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/checkPropTypes.js
 */
var react_component_stack_frame_1 = require("@zenflux/react-shared/src/react-component-stack-frame");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var has_own_property_1 = require("@zenflux/react-shared/src/has-own-property");
var loggedTypeFailures = {};
var ReactDebugCurrentFrame = react_shared_internals_1.default === null || react_shared_internals_1.default === void 0 ? void 0 : react_shared_internals_1.default.ReactDebugCurrentFrame;
function setCurrentlyValidatingElement(element) {
    if (__DEV__) {
        if (element) {
            var owner = element._owner;
            var stack = (0, react_component_stack_frame_1.describeUnknownElementTypeFrameInDEV)(element.type, element._source, owner ? owner.type : null);
            ReactDebugCurrentFrame.setExtraStackFrame(stack);
        }
        else {
            ReactDebugCurrentFrame.setExtraStackFrame(null);
        }
    }
}
function checkPropTypes(typeSpecs, values, location, componentName, element) {
    if (__DEV__) {
        // $FlowFixMe[incompatible-use] This is okay but Flow doesn't know it.
        var has = Function.call.bind(has_own_property_1.default);
        for (var typeSpecName in typeSpecs) {
            if (has(typeSpecs, typeSpecName)) {
                var error = void 0;
                // Prop type validation may throw. In case they do, we don't want to
                // fail the render phase where it didn't fail before. So we log it.
                // After these have been cleaned up, we'll let them throw.
                try {
                    // This is intentionally an invariant that gets caught. It's the same
                    // behavior as without this statement except with a better message.
                    if (typeof typeSpecs[typeSpecName] !== "function") {
                        // not-used: eslint-disable-next-line react-internal/prod-error-codes
                        var err = Error((componentName || "React class") + ": " + location + " type `" + typeSpecName + "` is invalid; " + "it must be a function, usually from the `prop-types` package, but received `" + typeof typeSpecs[typeSpecName] + "`." + "This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                        err.name = "Invariant Violation";
                        throw err;
                    }
                    error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                }
                catch (ex) {
                    error = ex;
                }
                if (error && !(error instanceof Error)) {
                    setCurrentlyValidatingElement(element);
                    console.error("%s: type specification of %s" + " `%s` is invalid; the type checker " + "function must return `null` or an `Error` but returned a %s. " + "You may have forgotten to pass an argument to the type checker " + "creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and " + "shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error);
                    setCurrentlyValidatingElement(null);
                }
                if (error instanceof Error && !(error.message in loggedTypeFailures)) {
                    // Only monitor this failure once because there tends to be a lot of the
                    // same error.
                    loggedTypeFailures[error.message] = true;
                    setCurrentlyValidatingElement(element);
                    console.error("Failed %s type: %s", location, error.message);
                    setCurrentlyValidatingElement(null);
                }
            }
        }
    }
}
exports.default = checkPropTypes;
