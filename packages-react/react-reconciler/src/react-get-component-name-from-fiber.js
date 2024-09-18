"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var get_component_name_from_type_1 = require("@zenflux/react-shared/src/get-component-name-from-type");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
// Keep in sync with shared/getComponentNameFromType
function getWrappedName(outerType, innerType, wrapperName) {
    var functionName = innerType.displayName || innerType.name || "";
    return outerType.displayName || (functionName !== "" ? "".concat(wrapperName, "(").concat(functionName, ")") : wrapperName);
}
// Keep in sync with shared/getComponentNameFromType
function getContextName(type) {
    return type.displayName || "Context";
}
function reactGetComponentNameFromFiber(fiber) {
    var tag = fiber.tag, type = fiber.type;
    switch (tag) {
        case work_tags_1.WorkTag.CacheComponent:
            return "Cache";
        case work_tags_1.WorkTag.ContextConsumer:
            var context = type;
            return getContextName(context) + ".Consumer";
        case work_tags_1.WorkTag.ContextProvider:
            var provider = type;
            return getContextName(provider._context) + ".Provider";
        case work_tags_1.WorkTag.DehydratedFragment:
            return "DehydratedFragment";
        case work_tags_1.WorkTag.ForwardRef:
            return getWrappedName(type, type.render, "ForwardRef");
        case work_tags_1.WorkTag.Fragment:
            return "Fragment";
        case work_tags_1.WorkTag.HostHoistable:
        case work_tags_1.WorkTag.HostSingleton:
        case work_tags_1.WorkTag.HostComponent:
            // Host component type is the display name (e.g. "div", "View")
            return type;
        case work_tags_1.WorkTag.HostPortal:
            return "Portal";
        case work_tags_1.WorkTag.HostRoot:
            return "Root";
        case work_tags_1.WorkTag.HostText:
            return "Text";
        case work_tags_1.WorkTag.LazyComponent:
            // Name comes from the type in this case; we don't have a tag.
            return (0, get_component_name_from_type_1.default)(type);
        case work_tags_1.WorkTag.Mode:
            if (type === react_symbols_1.REACT_STRICT_MODE_TYPE) {
                // Don't be less specific than shared/getComponentNameFromType
                return "StrictMode";
            }
            return "Mode";
        case work_tags_1.WorkTag.OffscreenComponent:
            return "Offscreen";
        case work_tags_1.WorkTag.Profiler:
            return "Profiler";
        case work_tags_1.WorkTag.ScopeComponent:
            return "Scope";
        case work_tags_1.WorkTag.SuspenseComponent:
            return "Suspense";
        case work_tags_1.WorkTag.SuspenseListComponent:
            return "SuspenseList";
        case work_tags_1.WorkTag.TracingMarkerComponent:
            return "TracingMarker";
        // The display name for this tags come from the user-provided type:
        case work_tags_1.WorkTag.ClassComponent:
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.IncompleteClassComponent:
        case work_tags_1.WorkTag.IndeterminateComponent:
        case work_tags_1.WorkTag.MemoComponent:
        case work_tags_1.WorkTag.SimpleMemoComponent:
            if (typeof type === "function") {
                return type.displayName || type.name || null;
            }
            if (typeof type === "string") {
                return type;
            }
            break;
        case work_tags_1.WorkTag.LegacyHiddenComponent:
            if (react_feature_flags_1.enableLegacyHidden) {
                return "LegacyHidden";
            }
    }
    return null;
}
exports.default = reactGetComponentNameFromFiber;
