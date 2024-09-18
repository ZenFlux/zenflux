"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRef = exports.mountRef = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_fiber_hooks_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-shared");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_fiber_hooks_infra_1 = require("@zenflux/react-reconciler/src/react-fiber-hooks-infra");
function mountRef(initialValue) {
    var hook = (0, react_fiber_hooks_infra_1.mountWorkInProgressHook)();
    if (react_feature_flags_1.enableUseRefAccessWarning) {
        if (__DEV__) {
            // Support lazy initialization pattern shown in docs.
            // We need to store the caller stack frame so that we don't warn on subsequent renders.
            var hasBeenInitialized_1 = initialValue != null;
            var lazyInitGetterStack_1 = null;
            var didCheckForLazyInit_1 = false;
            // Only warn once per component+hook.
            var didWarnAboutRead_1 = false;
            var didWarnAboutWrite_1 = false;
            var current_1 = initialValue;
            var ref = {
                get current() {
                    if (!hasBeenInitialized_1) {
                        didCheckForLazyInit_1 = true;
                        lazyInitGetterStack_1 = (0, react_fiber_hooks_infra_1.getCallerStackFrame)();
                    }
                    else if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber !== null && !didWarnAboutRead_1) {
                        if (lazyInitGetterStack_1 === null || lazyInitGetterStack_1 !== (0, react_fiber_hooks_infra_1.getCallerStackFrame)()) {
                            didWarnAboutRead_1 = true;
                            console.warn("%s: Unsafe read of a mutable value during render.\n\n" + "Reading from a ref during render is only safe if:\n" + "1. The ref value has not been updated, or\n" + "2. The ref holds a lazily-initialized value that is only set once.\n", (0, react_get_component_name_from_fiber_1.default)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber) || "Unknown");
                        }
                    }
                    return current_1;
                },
                set current(value) {
                    if (react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber !== null && !didWarnAboutWrite_1) {
                        if (hasBeenInitialized_1 || !didCheckForLazyInit_1) {
                            didWarnAboutWrite_1 = true;
                            console.warn("%s: Unsafe write of a mutable value during render.\n\n" + "Writing to a ref during render is only safe if the ref holds " + "a lazily-initialized value that is only set once.\n", (0, react_get_component_name_from_fiber_1.default)(react_fiber_hooks_shared_1.ReactFiberHooksCurrent.renderingFiber) || "Unknown");
                        }
                    }
                    hasBeenInitialized_1 = true;
                    current_1 = value;
                }
            };
            Object.seal(ref);
            hook.memoizedState = ref;
            return ref;
        }
        else {
            var ref = {
                current: initialValue
            };
            hook.memoizedState = ref;
            return ref;
        }
    }
    else {
        var ref = {
            current: initialValue
        };
        hook.memoizedState = ref;
        return ref;
    }
}
exports.mountRef = mountRef;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function updateRef(initialValue) {
    var hook = (0, react_fiber_hooks_infra_1.updateWorkInProgressHook)();
    return hook.memoizedState;
}
exports.updateRef = updateRef;
