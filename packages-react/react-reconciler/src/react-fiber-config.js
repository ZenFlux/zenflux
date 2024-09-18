"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
// eslint-disable-next-line import/no-cycle
var domConfig = require("@zenflux/react-dom-bindings/src/client/react-fiber-config-dom");
// -------------------
//      BaseConfig
// -------------------
var ReactFiberConfigSupportsSwitchesMethods = [
    "supportsMutation",
    "supportsPersistence",
    "supportsHydration",
    "supportsMicrotasks",
    "supportsTestSelectors",
    "supportsResources",
    "supportsSingletons",
];
var ReactFiberConfigBaseMethods = [
    "getPublicInstance",
    "getRootHostContext",
    "getChildHostContext",
    "prepareForCommit",
    "resetAfterCommit",
    "createInstance",
    "appendInitialChild",
    "finalizeInitialChildren",
    "shouldSetTextContent",
    "createTextInstance",
    "scheduleTimeout",
    "cancelTimeout",
    "noTimeout",
    "isPrimaryRenderer",
    "warnsIfNotActing",
    "getInstanceFromNode",
    "beforeActiveInstanceBlur",
    "afterActiveInstanceBlur",
    "preparePortalMount",
    "prepareScopeUpdate",
    "getInstanceFromScope",
    "getCurrentEventPriority",
    "shouldAttemptEagerTransition",
    "detachDeletedInstance",
    "requestPostPaintCallback",
    "maySuspendCommit",
    "preloadInstance",
    "startSuspendingCommit",
    "suspendInstance",
    "waitForCommitToBeReady",
    "NotPendingTransition",
];
// -------------------
//      Mutation
// -------------------
var ReactFiberConfigMutationMethods = [
    "appendChild",
    "appendChildToContainer",
    "insertBefore",
    "insertInContainerBefore",
    "removeChild",
    "removeChildFromContainer",
    "resetTextContent",
    "commitTextUpdate",
    "commitMount",
    "commitUpdate",
    "hideInstance",
    "hideTextInstance",
    "unhideInstance",
    "unhideTextInstance",
    "clearContainer",
];
// -------------------
//      Persistent
// -------------------
var ReactFiberConfigPersistentMethods = [
    "cloneInstance",
    "createContainerChildSet",
    "appendChildToContainerChildSet",
    "finalizeContainerChildren",
    "replaceContainerChildren",
    "cloneHiddenInstance",
    "cloneHiddenTextInstance",
];
// -------------------
//      Hydration
// -------------------
var ReactFiberConfigHydrationMethods = [
    "isHydratableText",
    "isSuspenseInstancePending",
    "isSuspenseInstanceFallback",
    "getSuspenseInstanceFallbackErrorDetails",
    "registerSuspenseInstanceRetry",
    "canHydrateFormStateMarker",
    "isFormStateMarkerMatching",
    "getNextHydratableSibling",
    "getFirstHydratableChild",
    "getFirstHydratableChildWithinContainer",
    "getFirstHydratableChildWithinSuspenseInstance",
    "canHydrateInstance",
    "canHydrateTextInstance",
    "canHydrateSuspenseInstance",
    "hydrateInstance",
    "hydrateTextInstance",
    "hydrateSuspenseInstance",
    "getNextHydratableInstanceAfterSuspenseInstance",
    "commitHydratedContainer",
    "commitHydratedSuspenseInstance",
    "clearSuspenseBoundary",
    "clearSuspenseBoundaryFromContainer",
    "shouldDeleteUnhydratedTailInstances",
    "didNotMatchHydratedContainerTextInstance",
    "didNotMatchHydratedTextInstance",
    "didNotHydrateInstanceWithinContainer",
    "didNotHydrateInstanceWithinSuspenseInstance",
    "didNotHydrateInstance",
    "didNotFindHydratableInstanceWithinContainer",
    "didNotFindHydratableTextInstanceWithinContainer",
    "didNotFindHydratableSuspenseInstanceWithinContainer",
    "didNotFindHydratableInstanceWithinSuspenseInstance",
    "didNotFindHydratableTextInstanceWithinSuspenseInstance",
    "didNotFindHydratableSuspenseInstanceWithinSuspenseInstance",
    "didNotFindHydratableInstance",
    "didNotFindHydratableTextInstance",
    "didNotFindHydratableSuspenseInstance",
    "errorHydratingContainer",
];
// -------------------
//      Microtask
// -------------------
var ReactFiberConfigMicrotaskMethods = [
    "scheduleMicrotask",
];
// -------------------
//      TestSelector
// -------------------
var ReactFiberConfigTestSelectorMethods = [
    "findFiberRoot",
    "getBoundingRect",
    "getTextContent",
    "isHiddenSubtree",
    "matchAccessibilityRole",
    "setFocusIfFocusable",
    "setupIntersectionObserver",
];
// -------------------
//      Resource
// -------------------
var ReactFiberConfigResourceMethods = [
    "isHostHoistableType",
    "getHoistableRoot",
    "getResource",
    "acquireResource",
    "releaseResource",
    "hydrateHoistable",
    "mountHoistable",
    "unmountHoistable",
    "createHoistableInstance",
    "prepareToCommitHoistables",
    "mayResourceSuspendCommit",
    "preloadResource",
    "suspendResource",
];
// -------------------
//      Singleton
// -------------------
var ReactFiberConfigSingletonMethods = [
    "resolveSingletonInstance",
    "clearSingleton",
    "acquireSingletonInstance",
    "releaseSingletonInstance",
    "isHostSingletonType",
];
var ReactFiberConfig = /** @class */ (function () {
    function ReactFiberConfig() {
        // The issue is that on require this file it asks for all implementation methods, while some of them are optional.
        // To handle this we need to call only required constants
        this.config = {};
        this.configInternal = __assign(__assign({}, domConfig), {
            supportsPersistence: false
        });
        if ("undefined" !== typeof globalThis.__RECONCILER__CONFIG_INTERNAL__) {
            throw new Error("ReactFiberConfig should be initialized only once");
        }
        globalThis.__RECONCILER__CONFIG_INTERNAL__ = this.configInternal;
        this.config = __assign(__assign({}, this.configInternal), typeof globalThis.__RECONCILER__CONFIG__ !== "undefined" ? globalThis.__RECONCILER__CONFIG__ : {});
        this.initialize();
    }
    ReactFiberConfig.prototype.initialize = function () {
        var _this = this;
        var methodsAccordingToSupports = {
            supportsMutation: ReactFiberConfigMutationMethods,
            supportsPersistence: ReactFiberConfigPersistentMethods,
            supportsHydration: ReactFiberConfigHydrationMethods,
            supportsMicrotasks: ReactFiberConfigMicrotaskMethods,
            supportsTestSelectors: ReactFiberConfigTestSelectorMethods,
            supportsResources: ReactFiberConfigResourceMethods,
            supportsSingletons: ReactFiberConfigSingletonMethods,
        };
        var _loop_1 = function (supportKey) {
            if (!this_1.config[supportKey]) {
                // Disable all not supported methods
                var methods_1 = methodsAccordingToSupports[supportKey];
                methods_1.forEach(function (method) {
                    Object.defineProperty(_this, method, {
                        get: function () {
                            throw new Error("Method '".concat(method, "' is not supported, you can enable it via configuration key: ").concat(supportKey));
                        },
                    });
                });
                return "continue";
            }
            // Enable all supported methods
            var methods = methodsAccordingToSupports[supportKey];
            methods.forEach(function (method) {
                _this[method] = _this.config[method];
            });
        };
        var this_1 = this;
        for (var _i = 0, ReactFiberConfigSupportsSwitchesMethods_1 = ReactFiberConfigSupportsSwitchesMethods; _i < ReactFiberConfigSupportsSwitchesMethods_1.length; _i++) {
            var supportKey = ReactFiberConfigSupportsSwitchesMethods_1[_i];
            _loop_1(supportKey);
        }
    };
    return ReactFiberConfig;
}());
exports.default = new ReactFiberConfig();
