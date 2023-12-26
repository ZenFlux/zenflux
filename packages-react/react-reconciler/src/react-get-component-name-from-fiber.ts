import getComponentNameFromType from "@zenflux/react-shared/src/get-component-name-from-type";

import { enableLegacyHidden } from "@zenflux/react-shared/src/react-feature-flags";

import { REACT_STRICT_MODE_TYPE } from "@zenflux/react-shared/src/react-symbols";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import type { ReactContext, ReactProviderType } from "@zenflux/react-shared/src/react-types";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

// Keep in sync with shared/getComponentNameFromType
function getWrappedName( outerType: unknown, innerType: any, wrapperName: string ): string {
    const functionName = innerType.displayName || innerType.name || "";
    return ( outerType as any ).displayName || ( functionName !== "" ? `${ wrapperName }(${ functionName })` : wrapperName );
}

// Keep in sync with shared/getComponentNameFromType
function getContextName( type: ReactContext<any> ) {
    return type.displayName || "Context";
}

export default function reactGetComponentNameFromFiber( fiber: Fiber ): string | null {
    const {
        tag,
        type
    } = fiber;

    switch ( tag ) {
        case WorkTag.CacheComponent:
            return "Cache";

        case WorkTag.ContextConsumer:
            const context: ReactContext<any> = ( type as any );
            return getContextName( context ) + ".Consumer";

        case WorkTag.ContextProvider:
            const provider: ReactProviderType<any> = ( type as any );
            return getContextName( provider._context ) + ".Provider";

        case WorkTag.DehydratedFragment:
            return "DehydratedFragment";

        case WorkTag.ForwardRef:
            return getWrappedName( type, type.render, "ForwardRef" );

        case WorkTag.Fragment:
            return "Fragment";

        case WorkTag.HostHoistable:
        case WorkTag.HostSingleton:
        case WorkTag.HostComponent:
            // Host component type is the display name (e.g. "div", "View")
            return type;

        case WorkTag.HostPortal:
            return "Portal";

        case WorkTag.HostRoot:
            return "Root";

        case WorkTag.HostText:
            return "Text";

        case WorkTag.LazyComponent:
            // Name comes from the type in this case; we don't have a tag.
            return getComponentNameFromType( type );

        case WorkTag.Mode:
            if ( type === REACT_STRICT_MODE_TYPE ) {
                // Don't be less specific than shared/getComponentNameFromType
                return "StrictMode";
            }

            return "Mode";

        case WorkTag.OffscreenComponent:
            return "Offscreen";

        case WorkTag.Profiler:
            return "Profiler";

        case WorkTag.ScopeComponent:
            return "Scope";

        case WorkTag.SuspenseComponent:
            return "Suspense";

        case WorkTag.SuspenseListComponent:
            return "SuspenseList";

        case WorkTag.TracingMarkerComponent:
            return "TracingMarker";

        // The display name for this tags come from the user-provided type:
        case WorkTag.ClassComponent:
        case WorkTag.FunctionComponent:
        case WorkTag.IncompleteClassComponent:
        case WorkTag.IndeterminateComponent:
        case WorkTag.MemoComponent:
        case WorkTag.SimpleMemoComponent:
            if ( typeof type === "function" ) {
                return ( type as any ).displayName || type.name || null;
            }

            if ( typeof type === "string" ) {
                return type;
            }

            break;

        case WorkTag.LegacyHiddenComponent:
            if ( enableLegacyHidden ) {
                return "LegacyHidden";
            }

    }

    return null;
}
