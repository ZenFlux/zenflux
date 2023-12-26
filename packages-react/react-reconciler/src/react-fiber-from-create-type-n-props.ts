import {
    enableCache,
    enableDebugTracing,
    enableDO_NOT_USE_disableStrictPassiveEffect,
    enableFloat,
    enableHostSingletons,
    enableLegacyHidden,
    enableProfilerTimer,
    enableScopeAPI,
    enableTransitionTracing
} from "@zenflux/react-shared/src/react-feature-flags";

import {
    REACT_CACHE_TYPE,
    REACT_CONTEXT_TYPE,
    REACT_DEBUG_TRACING_MODE_TYPE,
    REACT_FORWARD_REF_TYPE,
    REACT_FRAGMENT_TYPE,
    REACT_LAZY_TYPE,
    REACT_LEGACY_HIDDEN_TYPE,
    REACT_MEMO_TYPE,
    REACT_OFFSCREEN_TYPE,
    REACT_PROFILER_TYPE,
    REACT_PROVIDER_TYPE,
    REACT_SCOPE_TYPE,
    REACT_STRICT_MODE_TYPE,
    REACT_SUSPENSE_LIST_TYPE,
    REACT_SUSPENSE_TYPE,
    REACT_TRACING_MARKER_TYPE
} from "@zenflux/react-shared/src/react-symbols";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";
import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { getHostContext } from "@zenflux/react-reconciler/src/react-fiber-host-context";

import reactGetComponentNameFromFiber from "@zenflux/react-reconciler/src/react-get-component-name-from-fiber";
import {
    createFiber,
    createFiberFromCache,
    createFiberFromFragment,
    createFiberFromSuspense,
    createFiberFromSuspenseList,
    createFiberFromTracingMarker
} from "@zenflux/react-reconciler/src/react-fiber";

import {
    resolveClassForHotReloading,
    resolveForwardRefForHotReloading,
    resolveFunctionForHotReloading
} from "@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole";
import { createFiberFromOffscreen } from "@zenflux/react-reconciler/src/react-fiber-create-from-offscreen";
import { createFiberFromLegacyHidden } from "@zenflux/react-reconciler/src/react-fiber-create-from-hidden";
import { shouldConstruct } from "@zenflux/react-reconciler/src/react-fiber-create-utils";

import type { Fiber, Lanes } from "@zenflux/react-shared/src/react-internal-types";
import type { Source } from "@zenflux/react-shared/src/react-element-type";
import type { ReactScope } from "@zenflux/react-shared/src/react-types";

const {
    isHostHoistableType,
    isHostSingletonType,
    supportsResources,
    supportsSingletons
} = globalThis.__RECONCILER__CONFIG__;

function createFiberFromScope( scope: ReactScope, pendingProps: any, mode: TypeOfMode, lanes: Lanes, key: null | string ) {
    const fiber = createFiber( WorkTag.ScopeComponent, pendingProps, key, mode );
    fiber.type = scope;
    fiber.elementType = scope;
    fiber.lanes = lanes;
    return fiber;
}

function createFiberFromProfiler( pendingProps: any, mode: TypeOfMode, lanes: Lanes, key: null | string ): Fiber {
    if ( __DEV__ ) {
        if ( typeof pendingProps.id !== "string" ) {
            console.error( "Profiler must specify an \"id\" of type `string` as a prop. Received the type `%s` instead.", typeof pendingProps.id );
        }
    }

    const fiber = createFiber( WorkTag.Profiler, pendingProps, key, mode | TypeOfMode.ProfileMode );
    fiber.elementType = REACT_PROFILER_TYPE;
    fiber.lanes = lanes;

    if ( enableProfilerTimer ) {
        fiber.stateNode = {
            effectDuration: 0,
            passiveEffectDuration: 0
        };
    }

    return fiber;
}

export function createFiberFromTypeAndProps(
    type: any, // React$ElementType
    key: null | string,
    pendingProps: any, source: null | Source, owner: null | Fiber,
    mode: TypeOfMode,
    lanes: Lanes
): Fiber {
    let fiberTag: WorkTag = WorkTag.IndeterminateComponent;
    // The resolved type is set if we know what the final type will be. I.e. it's not lazy.
    let resolvedType = type;

    if ( typeof type === "function" ) {
        if ( shouldConstruct( type ) ) {
            fiberTag = WorkTag.ClassComponent;

            if ( __DEV__ ) {
                resolvedType = resolveClassForHotReloading( resolvedType );
            }
        } else {
            if ( __DEV__ ) {
                resolvedType = resolveFunctionForHotReloading( resolvedType );
            }
        }
    } else if ( typeof type === "string" ) {
        if ( enableFloat && supportsResources && enableHostSingletons && supportsSingletons ) {
            const hostContext = getHostContext();
            fiberTag = isHostHoistableType( type, pendingProps, hostContext ) ?
                WorkTag.HostHoistable : isHostSingletonType( type ) ? WorkTag.HostSingleton : WorkTag.HostComponent;
        } else if ( enableFloat && supportsResources ) {
            const hostContext = getHostContext();
            fiberTag = isHostHoistableType( type, pendingProps, hostContext ) ?
                WorkTag.HostHoistable : WorkTag.HostComponent;
        } else if ( enableHostSingletons && supportsSingletons ) {
            fiberTag = isHostSingletonType( type ) ? WorkTag.HostSingleton : WorkTag.HostComponent;
        } else {
            fiberTag = WorkTag.HostComponent;
        }
    } else {
        getTag: switch ( type ) {
            case REACT_FRAGMENT_TYPE:
                return createFiberFromFragment( pendingProps.children, mode, lanes, key );

            case REACT_STRICT_MODE_TYPE:
                fiberTag = WorkTag.Mode;
                mode |= TypeOfMode.StrictLegacyMode;

                if ( ( mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode ) {
                    // Strict effects should never run on legacy roots
                    mode |= TypeOfMode.StrictEffectsMode;

                    if ( enableDO_NOT_USE_disableStrictPassiveEffect && pendingProps.DO_NOT_USE_disableStrictPassiveEffect ) {
                        mode |= TypeOfMode.NoStrictPassiveEffectsMode;
                    }
                }

                break;

            case REACT_PROFILER_TYPE:
                return createFiberFromProfiler( pendingProps, mode, lanes, key );

            case REACT_SUSPENSE_TYPE:
                return createFiberFromSuspense( pendingProps, mode, lanes, key );

            case REACT_SUSPENSE_LIST_TYPE:
                return createFiberFromSuspenseList( pendingProps, mode, lanes, key );

            case REACT_OFFSCREEN_TYPE:
                return createFiberFromOffscreen( pendingProps, mode, lanes, key );

            case REACT_LEGACY_HIDDEN_TYPE:
                if ( enableLegacyHidden ) {
                    return createFiberFromLegacyHidden( pendingProps, mode, lanes, key );
                }

            // Fall through
            case REACT_SCOPE_TYPE:
                if ( enableScopeAPI ) {
                    return createFiberFromScope( type, pendingProps, mode, lanes, key );
                }

            // Fall through
            case REACT_CACHE_TYPE:
                if ( enableCache ) {
                    return createFiberFromCache( pendingProps, mode, lanes, key );
                }

            // Fall through
            case REACT_TRACING_MARKER_TYPE:
                if ( enableTransitionTracing ) {
                    return createFiberFromTracingMarker( pendingProps, mode, lanes, key );
                }

            // Fall through
            case REACT_DEBUG_TRACING_MODE_TYPE:
                if ( enableDebugTracing ) {
                    fiberTag = WorkTag.Mode;
                    mode |= TypeOfMode.DebugTracingMode;
                    break;
                }

            // Fall through
            default: {
                if ( typeof type === "object" && type !== null ) {
                    switch ( type.$$typeof ) {
                        case REACT_PROVIDER_TYPE:
                            fiberTag = WorkTag.ContextProvider;
                            break getTag;

                        case REACT_CONTEXT_TYPE:
                            // This is a consumer
                            fiberTag = WorkTag.ContextConsumer;
                            break getTag;

                        case REACT_FORWARD_REF_TYPE:
                            fiberTag = WorkTag.ForwardRef;

                            if ( __DEV__ ) {
                                resolvedType = resolveForwardRefForHotReloading( resolvedType );
                            }

                            break getTag;

                        case REACT_MEMO_TYPE:
                            fiberTag = WorkTag.MemoComponent;
                            break getTag;

                        case REACT_LAZY_TYPE:
                            fiberTag = WorkTag.LazyComponent;
                            resolvedType = null;
                            break getTag;
                    }
                }

                let info = "";

                if ( __DEV__ ) {
                    if ( type === undefined || typeof type === "object" && type !== null && Object.keys( type ).length === 0 ) {
                        info += " You likely forgot to export your component from the file " + "it's defined in, or you might have mixed up default and " + "named imports.";
                    }

                    const ownerName = owner ? reactGetComponentNameFromFiber( owner ) : null;

                    if ( ownerName ) {
                        info += "\n\nCheck the render method of `" + ownerName + "`.";
                    }
                }

                throw new Error( "Element type is invalid: expected a string (for built-in " + "components) or a class/function (for composite components) " + `but got: ${ type == null ? type : typeof type }.${ info }` );
            }
        }
    }

    const fiber = createFiber( fiberTag, pendingProps, key, mode );
    fiber.elementType = type;
    fiber.type = resolvedType;
    fiber.lanes = lanes;

    if ( __DEV__ ) {
        fiber._debugSource = source;
        fiber._debugOwner = owner;
    }

    return fiber;
}
