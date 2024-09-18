"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canHydrateFormStateMarker = exports.canHydrateSuspenseInstance = exports.canHydrateTextInstance = exports.errorHydratingContainer = exports.didNotFindHydratableSuspenseInstance = exports.didNotFindHydratableTextInstance = exports.didNotFindHydratableInstance = exports.didNotFindHydratableSuspenseInstanceWithinSuspenseInstance = exports.didNotFindHydratableTextInstanceWithinSuspenseInstance = exports.didNotFindHydratableInstanceWithinSuspenseInstance = exports.didNotFindHydratableSuspenseInstanceWithinContainer = exports.didNotFindHydratableTextInstanceWithinContainer = exports.didNotFindHydratableInstanceWithinContainer = exports.didNotHydrateInstance = exports.didNotHydrateInstanceWithinSuspenseInstance = exports.didNotHydrateInstanceWithinContainer = exports.didNotMatchHydratedTextInstance = exports.didNotMatchHydratedContainerTextInstance = exports.shouldDeleteUnhydratedTailInstances = exports.commitHydratedSuspenseInstance = exports.commitHydratedContainer = exports.hydrateSuspenseInstance = exports.hydrateTextInstance = exports.hydrateInstance = exports.getFirstHydratableChildWithinSuspenseInstance = exports.getFirstHydratableChildWithinContainer = exports.getFirstHydratableChild = exports.getNextHydratableSibling = void 0;
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
var ReactDOMComponent_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponent");
var HTMLNodeType_1 = require("@zenflux/react-dom-bindings/src/client/HTMLNodeType");
var react_fiber_config_dom_suspense_data_flags_1 = require("@zenflux/react-dom-bindings/src/client/react-fiber-config-dom-suspense-data-flags");
var ReactDOMEventReplaying_1 = require("@zenflux/react-dom-bindings/src/events/ReactDOMEventReplaying");
var SUPPRESS_HYDRATION_WARNING = "suppressHydrationWarning";
function getNextHydratable(node) {
    // Skip non-hydratable nodes.
    for (; node != null; node = node.nextSibling) {
        var nodeType = node.nodeType;
        if (nodeType === HTMLNodeType_1.ELEMENT_NODE || nodeType === HTMLNodeType_1.TEXT_NODE) {
            break;
        }
        if (nodeType === HTMLNodeType_1.COMMENT_NODE) {
            var nodeData = node.data;
            if (nodeData === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_START_DATA || nodeData === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_FALLBACK_START_DATA || nodeData === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_PENDING_START_DATA || react_feature_flags_1.enableFormActions && react_feature_flags_1.enableAsyncActions && (nodeData === react_fiber_config_dom_suspense_data_flags_1.FORM_STATE_IS_MATCHING || nodeData === react_fiber_config_dom_suspense_data_flags_1.FORM_STATE_IS_NOT_MATCHING)) {
                break;
            }
            if (nodeData === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_END_DATA) {
                return null;
            }
        }
    }
    return node;
}
function getNextHydratableSibling(instance) {
    return getNextHydratable(instance.nextSibling);
}
exports.getNextHydratableSibling = getNextHydratableSibling;
function getFirstHydratableChild(parentInstance) {
    return getNextHydratable(parentInstance.firstChild);
}
exports.getFirstHydratableChild = getFirstHydratableChild;
function getFirstHydratableChildWithinContainer(parentContainer) {
    return getNextHydratable(parentContainer.firstChild);
}
exports.getFirstHydratableChildWithinContainer = getFirstHydratableChildWithinContainer;
function getFirstHydratableChildWithinSuspenseInstance(parentInstance) {
    return getNextHydratable(parentInstance.nextSibling);
}
exports.getFirstHydratableChildWithinSuspenseInstance = getFirstHydratableChildWithinSuspenseInstance;
function hydrateInstance(instance, type, props, hostContext, internalInstanceHandle /* Object */, shouldWarnDev) {
    (0, ReactDOMComponentTree_1.precacheFiberNode)(internalInstanceHandle, instance);
    // TODO: Possibly defer this until the commit phase where all the events
    // get attached.
    (0, ReactDOMComponentTree_1.updateFiberProps)(instance, props);
    // TODO: Temporary hack to check if we're in a concurrent root. We can delete
    // when the legacy root API is removed.
    var isConcurrentMode = (internalInstanceHandle.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode;
    (0, ReactDOMComponent_1.diffHydratedProperties)(instance, type, props, isConcurrentMode, shouldWarnDev, hostContext);
}
exports.hydrateInstance = hydrateInstance;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function hydrateTextInstance(textInstance, text, internalInstanceHandle /* Object */, shouldWarnDev) {
    (0, ReactDOMComponentTree_1.precacheFiberNode)(internalInstanceHandle, textInstance);
    // TODO: Temporary hack to check if we're in a concurrent root. We can delete
    // when the legacy root API is removed.
    var isConcurrentMode = (internalInstanceHandle.mode & type_of_mode_1.TypeOfMode.ConcurrentMode) !== type_of_mode_1.TypeOfMode.NoMode;
    return (0, ReactDOMComponent_1.diffHydratedText)(textInstance, text, isConcurrentMode);
}
exports.hydrateTextInstance = hydrateTextInstance;
function hydrateSuspenseInstance(suspenseInstance, internalInstanceHandle /* Object */) {
    (0, ReactDOMComponentTree_1.precacheFiberNode)(internalInstanceHandle, suspenseInstance);
}
exports.hydrateSuspenseInstance = hydrateSuspenseInstance;
function commitHydratedContainer(container) {
    // Retry if any event replaying was blocked on this.
    (0, ReactDOMEventReplaying_1.retryIfBlockedOn)(container);
}
exports.commitHydratedContainer = commitHydratedContainer;
function commitHydratedSuspenseInstance(suspenseInstance) {
    // Retry if any event replaying was blocked on this.
    (0, ReactDOMEventReplaying_1.retryIfBlockedOn)(suspenseInstance);
}
exports.commitHydratedSuspenseInstance = commitHydratedSuspenseInstance;
function shouldDeleteUnhydratedTailInstances(parentType) {
    return (react_feature_flags_1.enableHostSingletons || parentType !== "head" && parentType !== "body") && (!react_feature_flags_1.enableFormActions || parentType !== "form" && parentType !== "button");
}
exports.shouldDeleteUnhydratedTailInstances = shouldDeleteUnhydratedTailInstances;
function didNotMatchHydratedContainerTextInstance(parentContainer, textInstance, text, isConcurrentMode, shouldWarnDev) {
    (0, ReactDOMComponent_1.checkForUnmatchedText)(textInstance.nodeValue, text, isConcurrentMode, shouldWarnDev);
}
exports.didNotMatchHydratedContainerTextInstance = didNotMatchHydratedContainerTextInstance;
function didNotMatchHydratedTextInstance(parentType, parentProps, parentInstance, textInstance, text, isConcurrentMode, shouldWarnDev) {
    if (parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
        (0, ReactDOMComponent_1.checkForUnmatchedText)(textInstance.nodeValue, text, isConcurrentMode, shouldWarnDev);
    }
}
exports.didNotMatchHydratedTextInstance = didNotMatchHydratedTextInstance;
function didNotHydrateInstanceWithinContainer(parentContainer, instance) {
    if (__DEV__) {
        if (instance.nodeType === HTMLNodeType_1.ELEMENT_NODE) {
            (0, ReactDOMComponent_1.warnForDeletedHydratableElement)(parentContainer, instance);
        }
        else if (instance.nodeType === HTMLNodeType_1.COMMENT_NODE) { // TODO: warnForDeletedHydratableSuspenseBoundary
        }
        else {
            (0, ReactDOMComponent_1.warnForDeletedHydratableText)(parentContainer, instance);
        }
    }
}
exports.didNotHydrateInstanceWithinContainer = didNotHydrateInstanceWithinContainer;
function didNotHydrateInstanceWithinSuspenseInstance(parentInstance, instance) {
    if (__DEV__) {
        // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
        var parentNode = parentInstance.parentNode;
        if (parentNode !== null) {
            if (instance.nodeType === HTMLNodeType_1.ELEMENT_NODE) {
                (0, ReactDOMComponent_1.warnForDeletedHydratableElement)(parentNode, instance);
            }
            else if (instance.nodeType === HTMLNodeType_1.COMMENT_NODE) { // TODO: warnForDeletedHydratableSuspenseBoundary
            }
            else {
                (0, ReactDOMComponent_1.warnForDeletedHydratableText)(parentNode, instance);
            }
        }
    }
}
exports.didNotHydrateInstanceWithinSuspenseInstance = didNotHydrateInstanceWithinSuspenseInstance;
function didNotHydrateInstance(parentType, parentProps, parentInstance, instance, isConcurrentMode) {
    if (__DEV__) {
        if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
            if (instance.nodeType === HTMLNodeType_1.ELEMENT_NODE) {
                (0, ReactDOMComponent_1.warnForDeletedHydratableElement)(parentInstance, instance);
            }
            else if (instance.nodeType === HTMLNodeType_1.COMMENT_NODE) { // TODO: warnForDeletedHydratableSuspenseBoundary
            }
            else {
                (0, ReactDOMComponent_1.warnForDeletedHydratableText)(parentInstance, instance);
            }
        }
    }
}
exports.didNotHydrateInstance = didNotHydrateInstance;
function didNotFindHydratableInstanceWithinContainer(parentContainer, type, props) {
    if (__DEV__) {
        (0, ReactDOMComponent_1.warnForInsertedHydratedElement)(parentContainer, type, props);
    }
}
exports.didNotFindHydratableInstanceWithinContainer = didNotFindHydratableInstanceWithinContainer;
function didNotFindHydratableTextInstanceWithinContainer(parentContainer, text) {
    if (__DEV__) {
        (0, ReactDOMComponent_1.warnForInsertedHydratedText)(parentContainer, text);
    }
}
exports.didNotFindHydratableTextInstanceWithinContainer = didNotFindHydratableTextInstanceWithinContainer;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function didNotFindHydratableSuspenseInstanceWithinContainer(parentContainer) {
    if (__DEV__) { // TODO: warnForInsertedHydratedSuspense(parentContainer);
    }
}
exports.didNotFindHydratableSuspenseInstanceWithinContainer = didNotFindHydratableSuspenseInstanceWithinContainer;
function didNotFindHydratableInstanceWithinSuspenseInstance(parentInstance, type, props) {
    if (__DEV__) {
        // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
        var parentNode = parentInstance.parentNode;
        if (parentNode !== null)
            (0, ReactDOMComponent_1.warnForInsertedHydratedElement)(parentNode, type, props);
    }
}
exports.didNotFindHydratableInstanceWithinSuspenseInstance = didNotFindHydratableInstanceWithinSuspenseInstance;
function didNotFindHydratableTextInstanceWithinSuspenseInstance(parentInstance, text) {
    if (__DEV__) {
        // $FlowFixMe[incompatible-type]: Only Element or Document can be parent nodes.
        var parentNode = parentInstance.parentNode;
        if (parentNode !== null)
            (0, ReactDOMComponent_1.warnForInsertedHydratedText)(parentNode, text);
    }
}
exports.didNotFindHydratableTextInstanceWithinSuspenseInstance = didNotFindHydratableTextInstanceWithinSuspenseInstance;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function didNotFindHydratableSuspenseInstanceWithinSuspenseInstance(parentInstance) {
    if (__DEV__) { // const parentNode: Element | Document | null = parentInstance.parentNode as any;
        // TODO: warnForInsertedHydratedSuspense(parentNode);
    }
}
exports.didNotFindHydratableSuspenseInstanceWithinSuspenseInstance = didNotFindHydratableSuspenseInstanceWithinSuspenseInstance;
function didNotFindHydratableInstance(parentType, parentProps, parentInstance, type, props, isConcurrentMode) {
    if (__DEV__) {
        if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
            (0, ReactDOMComponent_1.warnForInsertedHydratedElement)(parentInstance, type, props);
        }
    }
}
exports.didNotFindHydratableInstance = didNotFindHydratableInstance;
function didNotFindHydratableTextInstance(parentType, parentProps, parentInstance, text, isConcurrentMode) {
    if (__DEV__) {
        if (isConcurrentMode || parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
            (0, ReactDOMComponent_1.warnForInsertedHydratedText)(parentInstance, text);
        }
    }
}
exports.didNotFindHydratableTextInstance = didNotFindHydratableTextInstance;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function didNotFindHydratableSuspenseInstance(parentType, parentProps, parentInstance) {
    if (__DEV__) { // TODO: warnForInsertedHydratedSuspense(parentInstance);
    }
}
exports.didNotFindHydratableSuspenseInstance = didNotFindHydratableSuspenseInstance;
function errorHydratingContainer(parentContainer) {
    if (__DEV__) {
        // TODO: This gets logged by onRecoverableError, too, so we should be
        // able to remove it.
        console.error("An error occurred during hydration. The server HTML was replaced with client content in <%s>.", parentContainer.nodeName.toLowerCase());
    }
}
exports.errorHydratingContainer = errorHydratingContainer;
function canHydrateTextInstance(instance, text, inRootOrSingleton) {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    if (text === "")
        return null;
    while (instance.nodeType !== HTMLNodeType_1.TEXT_NODE) {
        if (react_feature_flags_1.enableFormActions && instance.nodeType === HTMLNodeType_1.ELEMENT_NODE && instance.nodeName === "INPUT" && instance.type === "hidden") { // If we have extra hidden inputs, we don't mismatch. This allows us to
            // embed extra form data in the original form.
        }
        else if (!inRootOrSingleton || !react_feature_flags_1.enableHostSingletons) {
            return null;
        }
        var nextInstance = getNextHydratableSibling(instance);
        if (nextInstance === null) {
            return null;
        }
        instance = nextInstance;
    }
    // This has now been refined to a text node.
    return instance;
}
exports.canHydrateTextInstance = canHydrateTextInstance;
function canHydrateSuspenseInstance(instance, inRootOrSingleton) {
    while (instance.nodeType !== HTMLNodeType_1.COMMENT_NODE) {
        if (!inRootOrSingleton || !react_feature_flags_1.enableHostSingletons) {
            return null;
        }
        var nextInstance = getNextHydratableSibling(instance);
        if (nextInstance === null) {
            return null;
        }
        instance = nextInstance;
    }
    // This has now been refined to a suspense node.
    return instance;
}
exports.canHydrateSuspenseInstance = canHydrateSuspenseInstance;
function canHydrateFormStateMarker(instance, inRootOrSingleton) {
    while (instance.nodeType !== HTMLNodeType_1.COMMENT_NODE) {
        if (!inRootOrSingleton || !react_feature_flags_1.enableHostSingletons) {
            return null;
        }
        var nextInstance = getNextHydratableSibling(instance);
        if (nextInstance === null) {
            return null;
        }
        instance = nextInstance;
    }
    var nodeData = instance.data;
    if (nodeData === react_fiber_config_dom_suspense_data_flags_1.FORM_STATE_IS_MATCHING || nodeData === react_fiber_config_dom_suspense_data_flags_1.FORM_STATE_IS_NOT_MATCHING) {
        var markerInstance = instance;
        return markerInstance;
    }
    return null;
}
exports.canHydrateFormStateMarker = canHydrateFormStateMarker;
