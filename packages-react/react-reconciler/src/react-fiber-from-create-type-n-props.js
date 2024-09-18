"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFiberFromTypeAndProps = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_fiber_host_context_1 = require("@zenflux/react-reconciler/src/react-fiber-host-context");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_fiber_1 = require("@zenflux/react-reconciler/src/react-fiber");
var react_fiber_hot_reloading_resvole_1 = require("@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole");
var react_fiber_create_from_offscreen_1 = require("@zenflux/react-reconciler/src/react-fiber-create-from-offscreen");
var react_fiber_create_from_hidden_1 = require("@zenflux/react-reconciler/src/react-fiber-create-from-hidden");
var react_fiber_create_utils_1 = require("@zenflux/react-reconciler/src/react-fiber-create-utils");
var _a = globalThis.__RECONCILER__CONFIG__, isHostHoistableType = _a.isHostHoistableType, isHostSingletonType = _a.isHostSingletonType, supportsResources = _a.supportsResources, supportsSingletons = _a.supportsSingletons;
function createFiberFromScope(scope, pendingProps, mode, lanes, key) {
    var fiber = (0, react_fiber_1.createFiber)(work_tags_1.WorkTag.ScopeComponent, pendingProps, key, mode);
    fiber.type = scope;
    fiber.elementType = scope;
    fiber.lanes = lanes;
    return fiber;
}
function createFiberFromProfiler(pendingProps, mode, lanes, key) {
    if (__DEV__) {
        if (typeof pendingProps.id !== "string") {
            console.error("Profiler must specify an \"id\" of type `string` as a prop. Received the type `%s` instead.", typeof pendingProps.id);
        }
    }
    var fiber = (0, react_fiber_1.createFiber)(work_tags_1.WorkTag.Profiler, pendingProps, key, mode | type_of_mode_1.TypeOfMode.ProfileMode);
    fiber.elementType = react_symbols_1.REACT_PROFILER_TYPE;
    fiber.lanes = lanes;
    if (react_feature_flags_1.enableProfilerTimer) {
        fiber.stateNode = {
            effectDuration: 0,
            passiveEffectDuration: 0
        };
    }
    return fiber;
}
function createFiberFromTypeAndProps(type, // React$ElementType
key, pendingProps, source, owner, mode, lanes) {
    var fiberTag = work_tags_1.WorkTag.IndeterminateComponent;
    // The resolved type is set if we know what the final type will be. I.e. it's not lazy.
    var resolvedType = type;
    if (typeof type === "function") {
        if ((0, react_fiber_create_utils_1.shouldConstruct)(type)) {
            fiberTag = work_tags_1.WorkTag.ClassComponent;
            if (__DEV__) {
                resolvedType = (0, react_fiber_hot_reloading_resvole_1.resolveClassForHotReloading)(resolvedType);
            }
        }
        else {
            if (__DEV__) {
                resolvedType = (0, react_fiber_hot_reloading_resvole_1.resolveFunctionForHotReloading)(resolvedType);
            }
        }
    }
    else if (typeof type === "string") {
        if (react_feature_flags_1.enableFloat && supportsResources && react_feature_flags_1.enableHostSingletons && supportsSingletons) {
            var hostContext = (0, react_fiber_host_context_1.getHostContext)();
            fiberTag = isHostHoistableType(type, pendingProps, hostContext) ?
                work_tags_1.WorkTag.HostHoistable : isHostSingletonType(type) ? work_tags_1.WorkTag.HostSingleton : work_tags_1.WorkTag.HostComponent;
        }
        else if (react_feature_flags_1.enableFloat && supportsResources) {
            var hostContext = (0, react_fiber_host_context_1.getHostContext)();
            fiberTag = isHostHoistableType(type, pendingProps, hostContext) ?
                work_tags_1.WorkTag.HostHoistable : work_tags_1.WorkTag.HostComponent;
        }
        else if (react_feature_flags_1.enableHostSingletons && supportsSingletons) {
            fiberTag = isHostSingletonType(type) ? work_tags_1.WorkTag.HostSingleton : work_tags_1.WorkTag.HostComponent;
        }
        else {
            fiberTag = work_tags_1.WorkTag.HostComponent;
        }
    }
    else {
        getTag: switch (type) {
            case react_symbols_1.REACT_FRAGMENT_TYPE:
                return (0, react_fiber_1.createFiberFromFragment)(pendingProps.children, mode, lanes, key);
            case react_symbols_1.REACT_STRICT_MODE_TYPE:
                fiberTag = work_tags_1.WorkTag.Mode;
                mode |= type_of_mode_1.TypeOfMode.StrictLegacyMode;
                if ((mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode) {
                    // Strict effects should never run on legacy roots
                    mode |= type_of_mode_1.TypeOfMode.StrictEffectsMode;
                    if (react_feature_flags_1.enableDO_NOT_USE_disableStrictPassiveEffect && pendingProps.DO_NOT_USE_disableStrictPassiveEffect) {
                        mode |= type_of_mode_1.TypeOfMode.NoStrictPassiveEffectsMode;
                    }
                }
                break;
            case react_symbols_1.REACT_PROFILER_TYPE:
                return createFiberFromProfiler(pendingProps, mode, lanes, key);
            case react_symbols_1.REACT_SUSPENSE_TYPE:
                return (0, react_fiber_1.createFiberFromSuspense)(pendingProps, mode, lanes, key);
            case react_symbols_1.REACT_SUSPENSE_LIST_TYPE:
                return (0, react_fiber_1.createFiberFromSuspenseList)(pendingProps, mode, lanes, key);
            case react_symbols_1.REACT_OFFSCREEN_TYPE:
                return (0, react_fiber_create_from_offscreen_1.createFiberFromOffscreen)(pendingProps, mode, lanes, key);
            case react_symbols_1.REACT_LEGACY_HIDDEN_TYPE:
                if (react_feature_flags_1.enableLegacyHidden) {
                    return (0, react_fiber_create_from_hidden_1.createFiberFromLegacyHidden)(pendingProps, mode, lanes, key);
                }
            // Fall through
            case react_symbols_1.REACT_SCOPE_TYPE:
                if (react_feature_flags_1.enableScopeAPI) {
                    return createFiberFromScope(type, pendingProps, mode, lanes, key);
                }
            // Fall through
            case react_symbols_1.REACT_CACHE_TYPE:
                if (react_feature_flags_1.enableCache) {
                    return (0, react_fiber_1.createFiberFromCache)(pendingProps, mode, lanes, key);
                }
            // Fall through
            case react_symbols_1.REACT_TRACING_MARKER_TYPE:
                if (react_feature_flags_1.enableTransitionTracing) {
                    return (0, react_fiber_1.createFiberFromTracingMarker)(pendingProps, mode, lanes, key);
                }
            // Fall through
            case react_symbols_1.REACT_DEBUG_TRACING_MODE_TYPE:
                if (react_feature_flags_1.enableDebugTracing) {
                    fiberTag = work_tags_1.WorkTag.Mode;
                    mode |= type_of_mode_1.TypeOfMode.DebugTracingMode;
                    break;
                }
            // Fall through
            default: {
                if (typeof type === "object" && type !== null) {
                    switch (type.$$typeof) {
                        case react_symbols_1.REACT_PROVIDER_TYPE:
                            fiberTag = work_tags_1.WorkTag.ContextProvider;
                            break getTag;
                        case react_symbols_1.REACT_CONTEXT_TYPE:
                            // This is a consumer
                            fiberTag = work_tags_1.WorkTag.ContextConsumer;
                            break getTag;
                        case react_symbols_1.REACT_FORWARD_REF_TYPE:
                            fiberTag = work_tags_1.WorkTag.ForwardRef;
                            if (__DEV__) {
                                resolvedType = (0, react_fiber_hot_reloading_resvole_1.resolveForwardRefForHotReloading)(resolvedType);
                            }
                            break getTag;
                        case react_symbols_1.REACT_MEMO_TYPE:
                            fiberTag = work_tags_1.WorkTag.MemoComponent;
                            break getTag;
                        case react_symbols_1.REACT_LAZY_TYPE:
                            fiberTag = work_tags_1.WorkTag.LazyComponent;
                            resolvedType = null;
                            break getTag;
                    }
                }
                var info = "";
                if (__DEV__) {
                    if (type === undefined || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
                        info += " You likely forgot to export your component from the file " + "it's defined in, or you might have mixed up default and " + "named imports.";
                    }
                    var ownerName = owner ? (0, react_get_component_name_from_fiber_1.default)(owner) : null;
                    if (ownerName) {
                        info += "\n\nCheck the render method of `" + ownerName + "`.";
                    }
                }
                throw new Error("Element type is invalid: expected a string (for built-in " + "components) or a class/function (for composite components) " + "but got: ".concat(type == null ? type : typeof type, ".").concat(info));
            }
        }
    }
    var fiber = (0, react_fiber_1.createFiber)(fiberTag, pendingProps, key, mode);
    fiber.elementType = type;
    fiber.type = resolvedType;
    fiber.lanes = lanes;
    if (__DEV__) {
        fiber._debugSource = source;
        fiber._debugOwner = owner;
    }
    return fiber;
}
exports.createFiberFromTypeAndProps = createFiberFromTypeAndProps;
