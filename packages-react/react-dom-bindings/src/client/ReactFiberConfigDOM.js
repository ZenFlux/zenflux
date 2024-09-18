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
exports.isFormStateMarkerMatching = exports.canHydrateInstance = exports.isHydratableText = exports.supportsHydration = exports.bindInstance = exports.clearContainer = exports.unhideTextInstance = exports.unhideInstance = exports.hideTextInstance = exports.hideInstance = exports.clearSuspenseBoundaryFromContainer = exports.clearSuspenseBoundary = exports.removeChildFromContainer = exports.removeChild = exports.insertInContainerBefore = exports.insertBefore = exports.appendChildToContainer = exports.appendChild = exports.commitTextUpdate = exports.resetTextContent = exports.commitUpdate = exports.commitMount = exports.supportsMutation = exports.scheduleMicrotask = exports.supportsMicrotasks = exports.getInstanceFromScope = exports.prepareScopeUpdate = exports.preparePortalMount = exports.getInstanceFromNode = exports.noTimeout = exports.cancelTimeout = exports.scheduleTimeout = exports.warnsIfNotActing = exports.isPrimaryRenderer = exports.shouldAttemptEagerTransition = exports.getCurrentEventPriority = exports.createTextInstance = exports.shouldSetTextContent = exports.finalizeInitialChildren = exports.appendInitialChild = exports.createInstance = exports.createHoistableInstance = exports.resetAfterCommit = exports.afterActiveInstanceBlur = exports.beforeActiveInstanceBlur = exports.prepareForCommit = exports.getPublicInstance = exports.getChildHostContext = exports.getRootHostContext = exports.detachDeletedInstance = void 0;
exports.NotPendingTransition = exports.waitForCommitToBeReady = exports.suspendResource = exports.suspendInstance = exports.startSuspendingCommit = exports.preloadResource = exports.preloadInstance = exports.mayResourceSuspendCommit = exports.maySuspendCommit = exports.isHostHoistableType = exports.unmountHoistable = exports.mountHoistable = exports.hydrateHoistable = exports.releaseResource = exports.acquireResource = exports.getResource = exports.ReactDOMClientDispatcher = exports.getHoistableRoot = exports.prepareToCommitHoistables = exports.supportsResources = exports.clearSingleton = exports.releaseSingletonInstance = exports.acquireSingletonInstance = exports.resolveSingletonInstance = exports.isHostSingletonType = exports.supportsSingletons = exports.requestPostPaintCallback = exports.setupIntersectionObserver = exports.setFocusIfFocusable = exports.isHiddenSubtree = exports.getTextContent = exports.matchAccessibilityRole = exports.getBoundingRect = exports.findFiberRoot = exports.supportsTestSelectors = void 0;
var react_fiber_host_context_1 = require("@zenflux/react-reconciler/src/react-fiber-host-context");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var check_string_coercion_1 = require("@zenflux/react-shared/src/check-string-coercion");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var has_own_property_1 = require("@zenflux/react-shared/src/has-own-property");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var ReactDOMComponent_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponent");
var react_fiber_config_host_context_namespace_1 = require("@zenflux/react-dom-bindings/src/client/react-fiber-config-host-context-namespace");
var react_fiber_config_dom_suspense_data_flags_1 = require("@zenflux/react-dom-bindings/src/client/react-fiber-config-dom-suspense-data-flags");
var ReactDOMResourceValidation_1 = require("@zenflux/react-dom-bindings/src/shared/ReactDOMResourceValidation");
var DOMPluginEventSystem_1 = require("@zenflux/react-dom-bindings/src/events/DOMPluginEventSystem");
var ReactDOMEventReplaying_1 = require("@zenflux/react-dom-bindings/src/events/ReactDOMEventReplaying");
var react_dom_event_listener_priority_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-event-listener-priority");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
Object.defineProperty(exports, "detachDeletedInstance", { enumerable: true, get: function () { return ReactDOMComponentTree_1.detachDeletedInstance; } });
var DOMAccessibilityRoles_1 = require("@zenflux/react-dom-bindings/src/client/DOMAccessibilityRoles");
var ReactInputSelection_1 = require("@zenflux/react-dom-bindings/src/client/ReactInputSelection");
var setTextContent_1 = require("@zenflux/react-dom-bindings/src/client/setTextContent");
var validateDOMNesting_1 = require("@zenflux/react-dom-bindings/src/client/validateDOMNesting");
var react_dom_event_listener_dispatch_switch_1 = require("@zenflux/react-dom-bindings/src/client/react-dom-event-listener-dispatch-switch");
var DOMNamespaces_1 = require("@zenflux/react-dom-bindings/src/client/DOMNamespaces");
var HTMLNodeType_1 = require("@zenflux/react-dom-bindings/src/client/HTMLNodeType");
var escapeSelectorAttributeValueInsideDoubleQuotes_1 = require("@zenflux/react-dom-bindings/src/client/escapeSelectorAttributeValueInsideDoubleQuotes");
var ReactDOMFormActions_1 = require("@zenflux/react-dom-bindings/src/shared/ReactDOMFormActions");
var react_fiber_config_dom_hydrate_1 = require("@zenflux/react-dom-bindings/src/client/react-fiber-config-dom-hydrate");
var STYLE = "style";
var eventsEnabled = null;
var selectionInformation = null;
// export * from "@zenflux/react-reconciler/src/ReactFiberConfigWithNoPersistence";
function getOwnerDocumentFromRootContainer(rootContainerElement) {
    return rootContainerElement.nodeType === HTMLNodeType_1.DOCUMENT_NODE ? rootContainerElement : rootContainerElement.ownerDocument;
}
function getRootHostContext(rootContainerInstance) {
    var type;
    var context;
    var nodeType = rootContainerInstance.nodeType;
    switch (nodeType) {
        case HTMLNodeType_1.DOCUMENT_NODE:
        case HTMLNodeType_1.DOCUMENT_FRAGMENT_NODE: {
            type = nodeType === HTMLNodeType_1.DOCUMENT_NODE ? "#document" : "#fragment";
            var root = rootContainerInstance.documentElement;
            if (root) {
                var namespaceURI = root.namespaceURI;
                context = namespaceURI ?
                    getOwnHostContext(namespaceURI) : react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceNone;
            }
            else {
                context = react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceNone;
            }
            break;
        }
        default: {
            var container = nodeType === HTMLNodeType_1.COMMENT_NODE ? rootContainerInstance.parentNode : rootContainerInstance;
            type = container.tagName;
            var namespaceURI = container.namespaceURI;
            if (!namespaceURI) {
                switch (type) {
                    case "svg":
                        context = react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceSvg;
                        break;
                    case "math":
                        context = react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceMath;
                        break;
                    default:
                        context = react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceNone;
                        break;
                }
            }
            else {
                var ownContext = getOwnHostContext(namespaceURI);
                context = getChildHostContextProd(ownContext, type);
            }
            break;
        }
    }
    if (__DEV__) {
        var validatedTag = type.toLowerCase();
        var ancestorInfo = (0, validateDOMNesting_1.updatedAncestorInfoDev)(null, validatedTag);
        return {
            context: context,
            ancestorInfo: ancestorInfo
        };
    }
    return context;
}
exports.getRootHostContext = getRootHostContext;
function getOwnHostContext(namespaceURI) {
    switch (namespaceURI) {
        case DOMNamespaces_1.SVG_NAMESPACE:
            return react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceSvg;
        case DOMNamespaces_1.MATH_NAMESPACE:
            return react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceMath;
        default:
            return react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceNone;
    }
}
function getChildHostContextProd(parentNamespace, type) {
    if (parentNamespace === react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceNone) {
        // No (or default) parent namespace: potential entry point.
        switch (type) {
            case "svg":
                return react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceSvg;
            case "math":
                return react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceMath;
            default:
                return react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceNone;
        }
    }
    if (parentNamespace === react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceSvg && type === "foreignObject") {
        // We're leaving SVG.
        return react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceNone;
    }
    // By default, pass namespace below.
    return parentNamespace;
}
function getChildHostContext(parentHostContext, type) {
    if (__DEV__) {
        var parentHostContextDev = parentHostContext;
        var context = getChildHostContextProd(parentHostContextDev.context, type);
        var ancestorInfo = (0, validateDOMNesting_1.updatedAncestorInfoDev)(parentHostContextDev.ancestorInfo, type);
        return {
            context: context,
            ancestorInfo: ancestorInfo
        };
    }
    var parentNamespace = parentHostContext;
    return getChildHostContextProd(parentNamespace, type);
}
exports.getChildHostContext = getChildHostContext;
function getPublicInstance(instance) {
    return instance;
}
exports.getPublicInstance = getPublicInstance;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function prepareForCommit(containerInfo) {
    eventsEnabled = (0, react_dom_event_listener_dispatch_switch_1.isEnabled)();
    // TODO: 'as' here is not safe. Fix it.
    selectionInformation = (0, ReactInputSelection_1.getSelectionInformation)();
    var activeInstance = null;
    if (react_feature_flags_1.enableCreateEventHandleAPI) {
        var focusedElem = selectionInformation.focusedElem;
        if (focusedElem !== null) {
            activeInstance = (0, ReactDOMComponentTree_1.getClosestInstanceFromNode)(focusedElem);
        }
    }
    (0, react_dom_event_listener_dispatch_switch_1.setEnabled)(false);
    return activeInstance;
}
exports.prepareForCommit = prepareForCommit;
function beforeActiveInstanceBlur(internalInstanceHandle /* Object */) {
    if (react_feature_flags_1.enableCreateEventHandleAPI) {
        (0, react_dom_event_listener_dispatch_switch_1.setEnabled)(true);
        dispatchBeforeDetachedBlur(selectionInformation.focusedElem, internalInstanceHandle);
        (0, react_dom_event_listener_dispatch_switch_1.setEnabled)(false);
    }
}
exports.beforeActiveInstanceBlur = beforeActiveInstanceBlur;
function afterActiveInstanceBlur() {
    if (react_feature_flags_1.enableCreateEventHandleAPI) {
        (0, react_dom_event_listener_dispatch_switch_1.setEnabled)(true);
        dispatchAfterDetachedBlur(selectionInformation.focusedElem);
        (0, react_dom_event_listener_dispatch_switch_1.setEnabled)(false);
    }
}
exports.afterActiveInstanceBlur = afterActiveInstanceBlur;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function resetAfterCommit(containerInfo) {
    // Added by ZenFlux
    if (!selectionInformation) {
        throw new Error("Selection information is missing");
    }
    (0, ReactInputSelection_1.restoreSelection)(selectionInformation);
    (0, react_dom_event_listener_dispatch_switch_1.setEnabled)(eventsEnabled);
    eventsEnabled = null;
    selectionInformation = null;
}
exports.resetAfterCommit = resetAfterCommit;
function createHoistableInstance(type, props, rootContainerInstance, internalInstanceHandle /* Object */) {
    var ownerDocument = getOwnerDocumentFromRootContainer(rootContainerInstance);
    var domElement = ownerDocument.createElement(type);
    (0, ReactDOMComponentTree_1.precacheFiberNode)(internalInstanceHandle, domElement);
    (0, ReactDOMComponentTree_1.updateFiberProps)(domElement, props);
    (0, ReactDOMComponent_1.setInitialProperties)(domElement, type, props);
    (0, ReactDOMComponentTree_1.markNodeAsHoistable)(domElement);
    return domElement;
}
exports.createHoistableInstance = createHoistableInstance;
var didWarnScriptTags = false;
var warnedUnknownTags = {
    // There are working polyfills for <dialog>. Let people use it.
    dialog: true,
    // Electron ships a custom <webview> tag to display external web content in
    // an isolated frame and process.
    // This tag is not present in non Electron environments such as JSDom which
    // is often used for testing purposes.
    // @see https://electronjs.org/docs/api/webview-tag
    webview: true
};
function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle /* Object */) {
    var hostContextProd;
    if (__DEV__) {
        // TODO: take namespace into account when validating.
        var hostContextDev = hostContext;
        (0, validateDOMNesting_1.validateDOMNesting)(type, hostContextDev.ancestorInfo);
        hostContextProd = hostContextDev.context;
    }
    else {
        hostContextProd = hostContext;
    }
    var ownerDocument = getOwnerDocumentFromRootContainer(rootContainerInstance);
    var domElement;
    switch (hostContextProd) {
        case react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceSvg:
            domElement = ownerDocument.createElementNS(DOMNamespaces_1.SVG_NAMESPACE, type);
            break;
        case react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceMath:
            domElement = ownerDocument.createElementNS(DOMNamespaces_1.MATH_NAMESPACE, type);
            break;
        default:
            switch (type) {
                case "svg": {
                    domElement = ownerDocument.createElementNS(DOMNamespaces_1.SVG_NAMESPACE, type);
                    break;
                }
                case "math": {
                    domElement = ownerDocument.createElementNS(DOMNamespaces_1.MATH_NAMESPACE, type);
                    break;
                }
                case "script": {
                    // Create the script via .innerHTML so its "parser-inserted" flag is
                    // set to true and it does not execute
                    var div = ownerDocument.createElement("div");
                    if (__DEV__) {
                        if (react_feature_flags_1.enableTrustedTypesIntegration && !didWarnScriptTags) {
                            console.error("Encountered a script tag while rendering React component. " + "Scripts inside React components are never executed when rendering " + "on the client. Consider using template tag instead " + "(https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template).");
                            didWarnScriptTags = true;
                        }
                    }
                    div.innerHTML = '<script><' + '/script>'; // eslint-disable-line
                    // This is guaranteed to yield a script element.
                    var firstChild = div.firstChild;
                    domElement = div.removeChild(firstChild);
                    break;
                }
                case "select": {
                    if (typeof props.is === "string") {
                        domElement = ownerDocument.createElement("select", {
                            is: props.is
                        });
                    }
                    else {
                        // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
                        // See discussion in https://github.com/facebook/react/pull/6896
                        // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
                        domElement = ownerDocument.createElement("select");
                    }
                    if (props.multiple) {
                        domElement.multiple = true;
                    }
                    else if (props.size) {
                        // Setting a size greater than 1 causes a select to behave like `multiple=true`, where
                        // it is possible that no option is selected.
                        //
                        // This is only necessary when a select in "single selection mode".
                        domElement.size = props.size;
                    }
                    break;
                }
                default: {
                    if (typeof props.is === "string") {
                        domElement = ownerDocument.createElement(type, {
                            is: props.is
                        });
                    }
                    else {
                        // Separate else branch instead of using `props.is || undefined` above because of a Firefox bug.
                        // See discussion in https://github.com/facebook/react/pull/6896
                        // and discussion in https://bugzilla.mozilla.org/show_bug.cgi?id=1276240
                        domElement = ownerDocument.createElement(type);
                    }
                    if (__DEV__) {
                        if (type.indexOf("-") === -1) {
                            // We're not SVG/MathML and we don't have a dash, so we're not a custom element
                            // Even if you use `is`, these should be of known type and lower case.
                            if (type !== type.toLowerCase()) {
                                console.error("<%s /> is using incorrect casing. " + "Use PascalCase for React components, " + "or lowercase for HTML elements.", type);
                            }
                            if ( // $FlowFixMe[method-unbinding]
                            Object.prototype.toString.call(domElement) === "[object HTMLUnknownElement]" && !has_own_property_1.default.call(warnedUnknownTags, type)) {
                                warnedUnknownTags[type] = true;
                                console.error("The tag <%s> is unrecognized in this browser. " + "If you meant to render a React component, start its name with " + "an uppercase letter.", type);
                            }
                        }
                    }
                }
            }
    }
    (0, ReactDOMComponentTree_1.precacheFiberNode)(internalInstanceHandle, domElement);
    (0, ReactDOMComponentTree_1.updateFiberProps)(domElement, props);
    return domElement;
}
exports.createInstance = createInstance;
function appendInitialChild(parentInstance, child) {
    parentInstance.appendChild(child);
}
exports.appendInitialChild = appendInitialChild;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function finalizeInitialChildren(domElement, type, props, hostContext) {
    (0, ReactDOMComponent_1.setInitialProperties)(domElement, type, props);
    switch (type) {
        case "button":
        case "input":
        case "select":
        case "textarea":
            return !!props.autoFocus;
        case "img":
            return true;
        default:
            return false;
    }
}
exports.finalizeInitialChildren = finalizeInitialChildren;
function shouldSetTextContent(type, props) {
    return type === "textarea" ||
        type === "noscript" ||
        typeof props.children === "string" ||
        typeof props.children === "number" ||
        typeof props.dangerouslySetInnerHTML === "object" &&
            props.dangerouslySetInnerHTML !== null &&
            // @ts-ignore
            props.dangerouslySetInnerHTML.__html != null;
}
exports.shouldSetTextContent = shouldSetTextContent;
function createTextInstance(text, rootContainerInstance, hostContext, internalInstanceHandle /* Object */) {
    if (__DEV__) {
        var hostContextDev = hostContext;
        var ancestor = hostContextDev.ancestorInfo.current;
        if (ancestor != null) {
            (0, validateDOMNesting_1.validateTextNesting)(text, ancestor.tag);
        }
    }
    var textNode = getOwnerDocumentFromRootContainer(rootContainerInstance).createTextNode(text);
    (0, ReactDOMComponentTree_1.precacheFiberNode)(internalInstanceHandle, textNode);
    return textNode;
}
exports.createTextInstance = createTextInstance;
function getCurrentEventPriority() {
    var currentEvent = window.event;
    if (currentEvent === undefined) {
        return react_event_priorities_1.DefaultEventPriority;
    }
    return (0, react_dom_event_listener_priority_1.getEventPriority)(currentEvent.type);
}
exports.getCurrentEventPriority = getCurrentEventPriority;
var currentPopstateTransitionEvent = null;
function shouldAttemptEagerTransition() {
    var event = window.event;
    if (event && event.type === "popstate") {
        // This is a popstate event. Attempt to render any transition during this
        // event synchronously. Unless we already attempted during this event.
        if (event === currentPopstateTransitionEvent) {
            // We already attempted to render this popstate transition synchronously.
            // Any subsequent attempts must have happened as the result of a derived
            // update, like startTransition inside useEffect, or useDV. Switch back to
            // the default behavior for all remaining transitions during the current
            // popstate event.
            return false;
        }
        else {
            // Cache the current event in case a derived transition is scheduled.
            // (Refer to previous branch.)
            currentPopstateTransitionEvent = event;
            return true;
        }
    }
    // We're not inside a popstate event.
    currentPopstateTransitionEvent = null;
    return false;
}
exports.shouldAttemptEagerTransition = shouldAttemptEagerTransition;
exports.isPrimaryRenderer = true;
exports.warnsIfNotActing = true;
// This initialization code may run even on server environments
// if a component just imports ReactDOM (e.g. for findDOMNode).
// Some environments might not have setTimeout or clearTimeout.
exports.scheduleTimeout = typeof setTimeout === "function" ? setTimeout : undefined;
exports.cancelTimeout = typeof clearTimeout === "function" ? clearTimeout : undefined;
exports.noTimeout = -1;
var localPromise = typeof Promise === "function" ? Promise : undefined;
var localRequestAnimationFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : exports.scheduleTimeout;
function getInstanceFromNode(node) {
    return (0, ReactDOMComponentTree_1.getClosestInstanceFromNode)(node) || null;
}
exports.getInstanceFromNode = getInstanceFromNode;
function preparePortalMount(portalInstance) {
    (0, DOMPluginEventSystem_1.listenToAllSupportedEvents)(portalInstance);
}
exports.preparePortalMount = preparePortalMount;
function prepareScopeUpdate(scopeInstance, internalInstanceHandle /* Object */) {
    if (react_feature_flags_1.enableScopeAPI) {
        (0, ReactDOMComponentTree_1.precacheFiberNode)(internalInstanceHandle, scopeInstance);
    }
}
exports.prepareScopeUpdate = prepareScopeUpdate;
function getInstanceFromScope(scopeInstance) {
    if (react_feature_flags_1.enableScopeAPI) {
        return (0, ReactDOMComponentTree_1.getFiberFromScopeInstance)(scopeInstance);
    }
    return null;
}
exports.getInstanceFromScope = getInstanceFromScope;
// -------------------
//     Microtasks
// -------------------
exports.supportsMicrotasks = true;
exports.scheduleMicrotask = typeof queueMicrotask === "function" ? queueMicrotask : typeof localPromise !== "undefined" ? function (callback) { return localPromise.resolve(null).then(callback).catch(handleErrorInNextTick); } : exports.scheduleTimeout;
// TODO: Determine the best fallback here.
function handleErrorInNextTick(error) {
    setTimeout(function () {
        throw error;
    });
}
// -------------------
//     Mutation
// -------------------
exports.supportsMutation = true;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function commitMount(domElement, type, newProps, internalInstanceHandle /* Object */) {
    // Despite the naming that might imply otherwise, this method only
    // fires if there is an `Update` effect scheduled during mounting.
    // This happens if `finalizeInitialChildren` returns `true` (which it
    // does to implement the `autoFocus` attribute on the client). But
    // there are also other cases when this might happen (such as patching
    // up text content during hydration mismatch). So we'll check this again.
    switch (type) {
        case "button":
        case "input":
        case "select":
        case "textarea":
            if (newProps.autoFocus) {
                domElement.focus();
            }
            return;
        case "img": {
            if (newProps.src) {
                domElement.src = newProps.src;
            }
            return;
        }
    }
}
exports.commitMount = commitMount;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function commitUpdate(domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle /* Object */) {
    // Diff and update the properties.
    (0, ReactDOMComponent_1.updateProperties)(domElement, type, oldProps, newProps);
    // Update the props handle so that we know which props are the ones with
    // with current event handlers.
    (0, ReactDOMComponentTree_1.updateFiberProps)(domElement, newProps);
}
exports.commitUpdate = commitUpdate;
function resetTextContent(domElement) {
    (0, setTextContent_1.default)(domElement, "");
}
exports.resetTextContent = resetTextContent;
function commitTextUpdate(textInstance, oldText, newText) {
    textInstance.nodeValue = newText;
}
exports.commitTextUpdate = commitTextUpdate;
function appendChild(parentInstance, child) {
    parentInstance.appendChild(child);
}
exports.appendChild = appendChild;
function appendChildToContainer(container, child) {
    var parentNode;
    if (container.nodeType === HTMLNodeType_1.COMMENT_NODE) {
        parentNode = container.parentNode;
        parentNode.insertBefore(child, container);
    }
    else {
        parentNode = container;
        parentNode.appendChild(child);
    }
    // This container might be used for a portal.
    // If something inside a portal is clicked, that click should bubble
    // through the React tree. However, on Mobile Safari the click would
    // never bubble through the *DOM* tree unless an ancestor with onclick
    // event exists. So we wouldn't see it and dispatch it.
    // This is why we ensure that non React root containers have inline onclick
    // defined.
    // https://github.com/facebook/react/issues/11918
    var reactRootContainer = container._reactRootContainer;
    if ((reactRootContainer === null || reactRootContainer === undefined) && parentNode.onclick === null) {
        // TODO: This cast may not be sound for SVG, MathML or custom elements.
        (0, ReactDOMComponent_1.trapClickOnNonInteractiveElement)(parentNode);
    }
}
exports.appendChildToContainer = appendChildToContainer;
function insertBefore(parentInstance, child, beforeChild) {
    parentInstance.insertBefore(child, beforeChild);
}
exports.insertBefore = insertBefore;
function insertInContainerBefore(container, child, beforeChild) {
    if (container.nodeType === HTMLNodeType_1.COMMENT_NODE) {
        container.parentNode.insertBefore(child, beforeChild);
    }
    else {
        container.insertBefore(child, beforeChild);
    }
}
exports.insertInContainerBefore = insertInContainerBefore;
function createEvent(type, bubbles) {
    var event = document.createEvent("Event");
    event.initEvent(type, bubbles, false);
    return event;
}
function dispatchBeforeDetachedBlur(target, internalInstanceHandle /* Object */) {
    if (react_feature_flags_1.enableCreateEventHandleAPI) {
        var event_1 = createEvent("beforeblur", true);
        // Dispatch "beforeblur" directly on the target,
        // so it gets picked up by the event system and
        // can propagate through the React internal tree.
        // $FlowFixMe[prop-missing]: internal field
        // @ts-ignore
        event_1._detachedInterceptFiber = internalInstanceHandle;
        target.dispatchEvent(event_1);
    }
}
function dispatchAfterDetachedBlur(target) {
    if (react_feature_flags_1.enableCreateEventHandleAPI) {
        var event_2 = createEvent("afterblur", false);
        // So we know what was detached, make the relatedTarget the
        // detached target on the "afterblur" event.
        event_2.relatedTarget = target;
        // Dispatch the event on the document.
        document.dispatchEvent(event_2);
    }
}
function removeChild(parentInstance, child) {
    parentInstance.removeChild(child);
}
exports.removeChild = removeChild;
function removeChildFromContainer(container, child) {
    if (container.nodeType === HTMLNodeType_1.COMMENT_NODE) {
        container.parentNode.removeChild(child);
    }
    else {
        container.removeChild(child);
    }
}
exports.removeChildFromContainer = removeChildFromContainer;
function clearSuspenseBoundary(parentInstance, suspenseInstance) {
    var node = suspenseInstance;
    // Delete all nodes within this suspense boundary.
    // There might be nested nodes so we need to keep track of how
    // deep we are and only break out when we're back on top.
    var depth = 0;
    do {
        var nextNode = node.nextSibling;
        parentInstance.removeChild(node);
        if (nextNode && nextNode.nodeType === HTMLNodeType_1.COMMENT_NODE) {
            var data = nextNode.data;
            if (data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_END_DATA) {
                if (depth === 0) {
                    parentInstance.removeChild(nextNode);
                    // Retry if any event replaying was blocked on this.
                    (0, ReactDOMEventReplaying_1.retryIfBlockedOn)(suspenseInstance);
                    return;
                }
                else {
                    depth--;
                }
            }
            else if (data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_START_DATA || data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_PENDING_START_DATA || data === react_fiber_config_dom_suspense_data_flags_1.SUSPENSE_FALLBACK_START_DATA) {
                depth++;
            }
        }
        // $FlowFixMe[incompatible-type] we bail out when we get a null
        node = nextNode;
    } while (node);
    // TODO: Warn, we didn't find the end comment boundary.
    // Retry if any event replaying was blocked on this.
    (0, ReactDOMEventReplaying_1.retryIfBlockedOn)(suspenseInstance);
}
exports.clearSuspenseBoundary = clearSuspenseBoundary;
function clearSuspenseBoundaryFromContainer(container, suspenseInstance) {
    if (container.nodeType === HTMLNodeType_1.COMMENT_NODE) {
        clearSuspenseBoundary(container.parentNode, suspenseInstance);
    }
    else if (container.nodeType === HTMLNodeType_1.ELEMENT_NODE) {
        clearSuspenseBoundary(container, suspenseInstance);
    }
    else { // Document nodes should never contain suspense boundaries.
    }
    // Retry if any event replaying was blocked on this.
    (0, ReactDOMEventReplaying_1.retryIfBlockedOn)(container);
}
exports.clearSuspenseBoundaryFromContainer = clearSuspenseBoundaryFromContainer;
function hideInstance(instance) {
    // TODO: Does this work for all element types? What about MathML? Should we
    // pass host context to this method?
    instance = instance;
    // @ts-ignore
    var style = instance.style;
    // $FlowFixMe[method-unbinding]
    if (typeof style.setProperty === "function") {
        style.setProperty("display", "none", "important");
    }
    else {
        style.display = "none";
    }
}
exports.hideInstance = hideInstance;
function hideTextInstance(textInstance) {
    textInstance.nodeValue = "";
}
exports.hideTextInstance = hideTextInstance;
function unhideInstance(instance, props) {
    instance = instance;
    var styleProp = props[STYLE];
    var display = styleProp !== undefined && styleProp !== null && styleProp.hasOwnProperty("display") ? styleProp.display : null;
    // @ts-ignore
    instance.style.display = display == null || typeof display === "boolean" ? "" : // The value would've errored already if it wasn't safe.
        // not-used: eslint-disable-next-line react-internal/safe-string-coercion
        ("" + display).trim();
}
exports.unhideInstance = unhideInstance;
function unhideTextInstance(textInstance, text) {
    textInstance.nodeValue = text;
}
exports.unhideTextInstance = unhideTextInstance;
function clearContainer(container) {
    if (react_feature_flags_1.enableHostSingletons) {
        var nodeType = container.nodeType;
        if (nodeType === HTMLNodeType_1.DOCUMENT_NODE) {
            clearContainerSparingly(container);
        }
        else if (nodeType === HTMLNodeType_1.ELEMENT_NODE) {
            switch (container.nodeName) {
                case "HEAD":
                case "HTML":
                case "BODY":
                    clearContainerSparingly(container);
                    return;
                default: {
                    container.textContent = "";
                }
            }
        }
    }
    else {
        if (container.nodeType === HTMLNodeType_1.ELEMENT_NODE) {
            // We have refined the container to Element type
            var element = container;
            element.textContent = "";
        }
        else if (container.nodeType === HTMLNodeType_1.DOCUMENT_NODE) {
            // We have refined the container to Document type
            var doc = container;
            if (doc.documentElement) {
                doc.removeChild(doc.documentElement);
            }
        }
    }
}
exports.clearContainer = clearContainer;
function clearContainerSparingly(container) {
    var node;
    var nextNode = container.firstChild;
    if (nextNode && nextNode.nodeType === HTMLNodeType_1.DOCUMENT_TYPE_NODE) {
        nextNode = nextNode.nextSibling;
    }
    while (nextNode) {
        node = nextNode;
        nextNode = nextNode.nextSibling;
        switch (node.nodeName) {
            case "HTML":
            case "HEAD":
            case "BODY": {
                var element = node;
                clearContainerSparingly(element);
                // If these singleton instances had previously been rendered with React they
                // may still hold on to references to the previous fiber tree. We detatch them
                // prospectively to reset them to a baseline starting state since we cannot create
                // new instances.
                (0, ReactDOMComponentTree_1.detachDeletedInstance)(element);
                continue;
            }
            // Script tags are retained to avoid an edge case bug. Normally scripts will execute if they
            // are ever inserted into the DOM. However when streaming if a script tag is opened but not
            // yet closed some browsers create and insert the script DOM Node but the script cannot execute
            // yet until the closing tag is parsed. If something causes React to call clearContainer while
            // this DOM node is in the document but not yet executable the DOM node will be removed from the
            // document and when the script closing tag comes in the script will not end up running. This seems
            // to happen in Chrome/Firefox but not Safari at the moment though this is not necessarily specified
            // behavior so it could change in future versions of browsers. While leaving all scripts is broader
            // than strictly necessary this is the least amount of additional code to avoid this breaking
            // edge case.
            //
            // Style tags are retained because they may likely come from 3rd party scripts and extensions
            case "SCRIPT":
            case "STYLE": {
                continue;
            }
            // Stylesheet tags are retained because tehy may likely come from 3rd party scripts and extensions
            case "LINK": {
                if (node.rel.toLowerCase() === "stylesheet") {
                    continue;
                }
            }
        }
        container.removeChild(node);
    }
    return;
}
// Making this so we can eventually move all of the instance caching to the commit phase.
// Currently this is only used to associate fiber and props to instances for hydrating
// HostSingletons. The reason we need it here is we only want to make this binding on commit
// because only one fiber can own the instance at a time and render can fail/restart
function bindInstance(instance, props, internalInstanceHandle) {
    (0, ReactDOMComponentTree_1.precacheFiberNode)(internalInstanceHandle, instance);
    (0, ReactDOMComponentTree_1.updateFiberProps)(instance, props);
}
exports.bindInstance = bindInstance;
// -------------------
//     Hydration
// -------------------
exports.supportsHydration = true;
function isHydratableText(text) {
    return text !== "";
}
exports.isHydratableText = isHydratableText;
function canHydrateInstance(instance, type, props, inRootOrSingleton) {
    while (instance.nodeType === HTMLNodeType_1.ELEMENT_NODE) {
        var element = instance;
        var anyProps = props;
        if (element.nodeName.toLowerCase() !== type.toLowerCase()) {
            if (!inRootOrSingleton || !react_feature_flags_1.enableHostSingletons) {
                // Usually we error for mismatched tags.
                if (react_feature_flags_1.enableFormActions && element.nodeName === "INPUT" && element.type === "hidden") { // If we have extra hidden inputs, we don't mismatch. This allows us to embed
                    // extra form data in the original form.
                }
                else {
                    return null;
                }
            } // In root or singleton parents we skip past mismatched instances.
        }
        else if (!inRootOrSingleton || !react_feature_flags_1.enableHostSingletons) {
            // Match
            if (react_feature_flags_1.enableFormActions && type === "input" && element.type === "hidden") {
                if (__DEV__) {
                    (0, check_string_coercion_1.checkAttributeStringCoercion)(anyProps.name, "name");
                }
                var name_1 = anyProps.name == null ? null : "" + anyProps.name;
                if (anyProps.type !== "hidden" || element.getAttribute("name") !== name_1) { // Skip past hidden inputs unless that's what we're looking for. This allows us
                    // embed extra form data in the original form.
                }
                else {
                    return element;
                }
            }
            else {
                return element;
            }
        }
        else if ((0, ReactDOMComponentTree_1.isMarkedHoistable)(element)) { // We've already claimed this as a hoistable which isn't hydrated this way so we skip past it.
        }
        else {
            // We have an Element with the right type.
            // We are going to try to exclude it if we can definitely identify it as a hoisted Node or if
            // we can guess that the node is likely hoisted or was inserted by a 3rd party script or browser extension
            // using high entropy attributes for certain types. This technique will fail for strange insertions like
            // extension prepending <div> in the <body> but that already breaks before and that is an edge case.
            switch (type) {
                // case 'title':
                //We assume all titles are matchable. You should only have one in the Document, at least in a hoistable scope
                // and if you are a WorkTag.HostComponent with type title we must either be in an <svg> context or this title must have an `itemProp` prop.
                case "meta": {
                    // The only way to opt out of hoisting meta tags is to give it an itemprop attribute. We assume there will be
                    // not 3rd party meta tags that are prepended, accepting the cases where this isn't true because meta tags
                    // are usually only functional for SSR so even in a rare case where we did bind to an injected tag the runtime
                    // implications are minimal
                    if (!element.hasAttribute("itemprop")) {
                        // This is a Hoistable
                        break;
                    }
                    return element;
                }
                case "link": {
                    // Links come in many forms and we do expect 3rd parties to inject them into <head> / <body>. We exclude known resources
                    // and then use high-entroy attributes like href which are almost always used and almost always unique to filter out unlikely
                    // matches.
                    var rel = element.getAttribute("rel");
                    if (rel === "stylesheet" && element.hasAttribute("data-precedence")) {
                        // This is a stylesheet resource
                        break;
                    }
                    else if (rel !== anyProps.rel || element.getAttribute("href") !== (anyProps.href == null ? null : anyProps.href) || element.getAttribute("crossorigin") !== (anyProps.crossOrigin == null ? null : anyProps.crossOrigin) || element.getAttribute("title") !== (anyProps.title == null ? null : anyProps.title)) {
                        // rel + href should usually be enough to uniquely identify a link however crossOrigin can vary for rel preconnect
                        // and title could vary for rel alternate
                        break;
                    }
                    return element;
                }
                case "style": {
                    // Styles are hard to match correctly. We can exclude known resources but otherwise we accept the fact that a non-hoisted style tags
                    // in <head> or <body> are likely never going to be unmounted given their position in the document and the fact they likely hold global styles
                    if (element.hasAttribute("data-precedence")) {
                        // This is a style resource
                        break;
                    }
                    return element;
                }
                case "script": {
                    // Scripts are a little tricky, we exclude known resources and then similar to links try to use high-entropy attributes
                    // to reject poor matches. One challenge with scripts are inline scripts. We don't attempt to check text content which could
                    // in theory lead to a hydration error later if a 3rd party injected an inline script before the React rendered nodes.
                    // Falling back to client rendering if this happens should be seemless though so we will try this hueristic and revisit later
                    // if we learn it is problematic
                    var srcAttr = element.getAttribute("src");
                    if (srcAttr !== (anyProps.src == null ? null : anyProps.src) || element.getAttribute("type") !== (anyProps.type == null ? null : anyProps.type) || element.getAttribute("crossorigin") !== (anyProps.crossOrigin == null ? null : anyProps.crossOrigin)) {
                        // This script is for a different src/type/crossOrigin. It may be a script resource
                        // or it may just be a mistmatch
                        if (srcAttr && element.hasAttribute("async") && !element.hasAttribute("itemprop")) {
                            // This is an async script resource
                            break;
                        }
                    }
                    return element;
                }
                default: {
                    // We have excluded the most likely cases of mismatch between hoistable tags, 3rd party script inserted tags,
                    // and browser extension inserted tags. While it is possible this is not the right match it is a decent hueristic
                    // that should work in the vast majority of cases.
                    return element;
                }
            }
        }
        var nextInstance = (0, react_fiber_config_dom_hydrate_1.getNextHydratableSibling)(element);
        if (nextInstance === null) {
            break;
        }
        instance = nextInstance;
    }
    // This is a suspense boundary or Text node or we got the end.
    // Suspense Boundaries are never expected to be injected by 3rd parties. If we see one it should be matched
    // and this is a hydration error.
    // Text Nodes are also not expected to be injected by 3rd parties. This is less of a guarantee for <body>
    // but it seems reasonable and conservative to reject this as a hydration error as well
    return null;
}
exports.canHydrateInstance = canHydrateInstance;
function isFormStateMarkerMatching(markerInstance) {
    return markerInstance.data === react_fiber_config_dom_suspense_data_flags_1.FORM_STATE_IS_MATCHING;
}
exports.isFormStateMarkerMatching = isFormStateMarkerMatching;
// -------------------
//     Test Selectors
// -------------------
exports.supportsTestSelectors = true;
function findFiberRoot(node) {
    var stack = [node];
    var index = 0;
    while (index < stack.length) {
        var current = stack[index++];
        if ((0, ReactDOMComponentTree_1.isContainerMarkedAsRoot)(current)) {
            return (0, ReactDOMComponentTree_1.getInstanceFromNode)(current);
        }
        // stack.push( ... current.children );
        stack.push.apply(stack, Array.from(current.children));
    }
    return null;
}
exports.findFiberRoot = findFiberRoot;
function getBoundingRect(node) {
    var rect = node.getBoundingClientRect();
    return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
    };
}
exports.getBoundingRect = getBoundingRect;
function matchAccessibilityRole(node, role) {
    if ((0, DOMAccessibilityRoles_1.hasRole)(node, role)) {
        return true;
    }
    return false;
}
exports.matchAccessibilityRole = matchAccessibilityRole;
function getTextContent(fiber) {
    switch (fiber.tag) {
        case work_tags_1.WorkTag.HostHoistable:
        case work_tags_1.WorkTag.HostSingleton:
        case work_tags_1.WorkTag.HostComponent:
            var textContent = "";
            var childNodes = fiber.stateNode.childNodes;
            for (var i = 0; i < childNodes.length; i++) {
                var childNode = childNodes[i];
                if (childNode.nodeType === Node.TEXT_NODE) {
                    textContent += childNode.textContent;
                }
            }
            return textContent;
        case work_tags_1.WorkTag.HostText:
            return fiber.stateNode.textContent;
    }
    return null;
}
exports.getTextContent = getTextContent;
function isHiddenSubtree(fiber) {
    return fiber.tag === work_tags_1.WorkTag.HostComponent && fiber.memoizedProps.hidden === true;
}
exports.isHiddenSubtree = isHiddenSubtree;
function setFocusIfFocusable(node) {
    // The logic for determining if an element is focusable is kind of complex,
    // and since we want to actually change focus anyway- we can just skip it.
    // Instead we'll just listen for a "focus" event to verify that focus was set.
    //
    // We could compare the node to document.activeElement after focus,
    // but this would not handle the case where application code managed focus to automatically blur.
    var didFocus = false;
    var handleFocus = function () {
        didFocus = true;
    };
    var element = node;
    try {
        element.addEventListener("focus", handleFocus);
        // $FlowFixMe[method-unbinding]
        (element.focus || HTMLElement.prototype.focus).call(element);
    }
    finally {
        element.removeEventListener("focus", handleFocus);
    }
    return didFocus;
}
exports.setFocusIfFocusable = setFocusIfFocusable;
function setupIntersectionObserver(targets, callback, options) {
    var rectRatioCache = new Map();
    targets.forEach(function (target) {
        rectRatioCache.set(target, {
            rect: getBoundingRect(target),
            ratio: 0
        });
    });
    var handleIntersection = function (entries) {
        entries.forEach(function (entry) {
            var boundingClientRect = entry.boundingClientRect, intersectionRatio = entry.intersectionRatio, target = entry.target;
            rectRatioCache.set(target, {
                rect: {
                    x: boundingClientRect.left,
                    y: boundingClientRect.top,
                    width: boundingClientRect.width,
                    height: boundingClientRect.height
                },
                ratio: intersectionRatio
            });
        });
        callback(Array.from(rectRatioCache.values()));
    };
    var observer = new IntersectionObserver(handleIntersection, options);
    targets.forEach(function (target) {
        observer.observe(target);
    });
    return {
        disconnect: function () { return observer.disconnect(); },
        observe: function (target) {
            rectRatioCache.set(target, {
                rect: getBoundingRect(target),
                ratio: 0
            });
            observer.observe(target);
        },
        unobserve: function (target) {
            rectRatioCache.delete(target);
            observer.unobserve(target);
        }
    };
}
exports.setupIntersectionObserver = setupIntersectionObserver;
function requestPostPaintCallback(callback) {
    localRequestAnimationFrame(function () {
        localRequestAnimationFrame(function (time) { return callback(time); });
    });
}
exports.requestPostPaintCallback = requestPostPaintCallback;
// -------------------
//     Singletons
// -------------------
exports.supportsSingletons = true;
function isHostSingletonType(type) {
    return type === "html" || type === "head" || type === "body";
}
exports.isHostSingletonType = isHostSingletonType;
function resolveSingletonInstance(type, props, rootContainerInstance, hostContext, validateDOMNestingDev) {
    if (__DEV__) {
        var hostContextDev = hostContext;
        if (validateDOMNestingDev) {
            (0, validateDOMNesting_1.validateDOMNesting)(type, hostContextDev.ancestorInfo);
        }
    }
    var ownerDocument = getOwnerDocumentFromRootContainer(rootContainerInstance);
    switch (type) {
        case "html": {
            var documentElement = ownerDocument.documentElement;
            if (!documentElement) {
                throw new Error("React expected an <html> element (document.documentElement) to exist in the Document but one was" + " not found. React never removes the documentElement for any Document it renders into so" + " the cause is likely in some other script running on this page.");
            }
            return documentElement;
        }
        case "head": {
            var head = ownerDocument.head;
            if (!head) {
                throw new Error("React expected a <head> element (document.head) to exist in the Document but one was" + " not found. React never removes the head for any Document it renders into so" + " the cause is likely in some other script running on this page.");
            }
            return head;
        }
        case "body": {
            var body = ownerDocument.body;
            if (!body) {
                throw new Error("React expected a <body> element (document.body) to exist in the Document but one was" + " not found. React never removes the body for any Document it renders into so" + " the cause is likely in some other script running on this page.");
            }
            return body;
        }
        default: {
            throw new Error("resolveSingletonInstance was called with an element type that is not supported. This is a bug in React.");
        }
    }
}
exports.resolveSingletonInstance = resolveSingletonInstance;
function acquireSingletonInstance(type, props, instance, internalInstanceHandle /* Object */) {
    if (__DEV__) {
        var currentInstanceHandle = (0, ReactDOMComponentTree_1.getInstanceFromNode)(instance);
        if (currentInstanceHandle) {
            var tagName = instance.tagName.toLowerCase();
            console.error("You are mounting a new %s component when a previous one has not first unmounted. It is an" + " error to render more than one %s component at a time and attributes and children of these" + " components will likely fail in unpredictable ways. Please only render a single instance of" + " <%s> and if you need to mount a new one, ensure any previous ones have unmounted first.", tagName, tagName, tagName);
        }
        switch (type) {
            case "html":
            case "head":
            case "body": {
                break;
            }
            default: {
                console.error("acquireSingletonInstance was called with an element type that is not supported. This is a bug in React.");
            }
        }
    }
    var attributes = instance.attributes;
    while (attributes.length) {
        instance.removeAttributeNode(attributes[0]);
    }
    (0, ReactDOMComponent_1.setInitialProperties)(instance, type, props);
    (0, ReactDOMComponentTree_1.precacheFiberNode)(internalInstanceHandle, instance);
    (0, ReactDOMComponentTree_1.updateFiberProps)(instance, props);
}
exports.acquireSingletonInstance = acquireSingletonInstance;
function releaseSingletonInstance(instance) {
    var attributes = instance.attributes;
    while (attributes.length) {
        instance.removeAttributeNode(attributes[0]);
    }
    (0, ReactDOMComponentTree_1.detachDeletedInstance)(instance);
}
exports.releaseSingletonInstance = releaseSingletonInstance;
function clearSingleton(instance) {
    var element = instance;
    var node = element.firstChild;
    while (node) {
        var nextNode = node.nextSibling;
        var nodeName = node.nodeName;
        if ((0, ReactDOMComponentTree_1.isMarkedHoistable)(node) || nodeName === "HEAD" || nodeName === "BODY" || nodeName === "SCRIPT" || nodeName === "STYLE" || nodeName === "LINK" && node.rel.toLowerCase() === "stylesheet") { // retain these nodes
        }
        else {
            element.removeChild(node);
        }
        node = nextNode;
    }
    return;
}
exports.clearSingleton = clearSingleton;
// -------------------
//     Resources
// -------------------
exports.supportsResources = true;
var NotLoaded = 
/*       */
0;
var Loaded = 
/*          */
1;
var Errored = 
/*         */
2;
var Settled = 
/*         */
3;
var Inserted = 
/*        */
4;
function prepareToCommitHoistables() {
    tagCaches = null;
}
exports.prepareToCommitHoistables = prepareToCommitHoistables;
// global collections of Resources
var preloadPropsMap = new Map();
var preconnectsSet = new Set();
// getRootNode is missing from IE and old jsdom versions
function getHoistableRoot(container) {
    // $FlowFixMe[method-unbinding]
    return (typeof container.getRootNode === "function" ?
        /**
         * $FlowFixMe[incompatible-return] Flow types this as returning a `Node`,
         * but it's either a `Document` or `ShadowRoot`.
         */
        container.getRootNode() : container.ownerDocument);
}
exports.getHoistableRoot = getHoistableRoot;
function getCurrentResourceRoot() {
    var currentContainer = (0, react_fiber_host_context_1.getCurrentRootHostContainer)();
    return currentContainer ? getHoistableRoot(currentContainer) : null;
}
function getDocumentFromRoot(root) {
    return root.ownerDocument || root;
}
// We want this to be the default dispatcher on ReactDOMSharedInternals but we don't want to mutate
// internals in Module scope. Instead we export it and Internals will import it. There is already a cycle
// from Internals -> ReactDOM -> HostConfig -> Internals so this doesn't introduce a new one.
exports.ReactDOMClientDispatcher = {
    prefetchDNS: prefetchDNS,
    preconnect: preconnect,
    preload: preload,
    preloadModule: preloadModule,
    preinitStyle: preinitStyle,
    preinitScript: preinitScript,
    preinitModuleScript: preinitModuleScript
};
// We expect this to get inlined. It is a function mostly to communicate the special nature of
// how we resolve the HoistableRoot for ReactDOM.pre*() methods. Because we support calling
// these methods outside of render there is no way to know which Document or ShadowRoot is 'scoped'
// and so we have to fall back to something universal. Currently we just refer to the global document.
// This is notable because nowhere else in ReactDOM do we actually reference the global document or window
// because we may be rendering inside an iframe.
function getDocumentForImperativeFloatMethods() {
    return document;
}
function preconnectAs(rel, href, crossOrigin) {
    var ownerDocument = getDocumentForImperativeFloatMethods();
    if (typeof href === "string" && href) {
        var limitedEscapedHref = (0, escapeSelectorAttributeValueInsideDoubleQuotes_1.default)(href);
        var key = "link[rel=\"".concat(rel, "\"][href=\"").concat(limitedEscapedHref, "\"]");
        if (typeof crossOrigin === "string") {
            key += "[crossorigin=\"".concat(crossOrigin, "\"]");
        }
        if (!preconnectsSet.has(key)) {
            preconnectsSet.add(key);
            var preconnectProps = {
                rel: rel,
                crossOrigin: crossOrigin,
                href: href
            };
            if (null === ownerDocument.querySelector(key)) {
                var instance = ownerDocument.createElement("link");
                (0, ReactDOMComponent_1.setInitialProperties)(instance, "link", preconnectProps);
                (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
                ownerDocument.head.appendChild(instance);
            }
        }
    }
}
function prefetchDNS(href) {
    if (!react_feature_flags_1.enableFloat) {
        return;
    }
    preconnectAs("dns-prefetch", href, null);
}
function preconnect(href, crossOrigin) {
    if (!react_feature_flags_1.enableFloat) {
        return;
    }
    preconnectAs("preconnect", href, crossOrigin);
}
function preload(href, as, options) {
    if (!react_feature_flags_1.enableFloat) {
        return;
    }
    var ownerDocument = getDocumentForImperativeFloatMethods();
    if (href && as && ownerDocument) {
        var preloadSelector = "link[rel=\"preload\"][as=\"".concat((0, escapeSelectorAttributeValueInsideDoubleQuotes_1.default)(as), "\"]");
        if (as === "image") {
            if (options && options.imageSrcSet) {
                preloadSelector += "[imagesrcset=\"".concat((0, escapeSelectorAttributeValueInsideDoubleQuotes_1.default)(options.imageSrcSet), "\"]");
                if (typeof options.imageSizes === "string") {
                    preloadSelector += "[imagesizes=\"".concat((0, escapeSelectorAttributeValueInsideDoubleQuotes_1.default)(options.imageSizes), "\"]");
                }
            }
            else {
                preloadSelector += "[href=\"".concat((0, escapeSelectorAttributeValueInsideDoubleQuotes_1.default)(href), "\"]");
            }
        }
        else {
            preloadSelector += "[href=\"".concat((0, escapeSelectorAttributeValueInsideDoubleQuotes_1.default)(href), "\"]");
        }
        // Some preloads are keyed under their selector. This happens when the preload is for
        // an arbitrary type. Other preloads are keyed under the resource key they represent a preload for.
        // Here we figure out which key to use to determine if we have a preload already.
        var key = preloadSelector;
        switch (as) {
            case "style":
                key = getStyleKey(href);
                break;
            case "script":
                key = getScriptKey(href);
                break;
        }
        if (!preloadPropsMap.has(key)) {
            var preloadProps = Object.assign({
                rel: "preload",
                // There is a bug in Safari where imageSrcSet is not respected on preload links
                // so we omit the href here if we have imageSrcSet b/c safari will load the wrong image.
                // This harms older browers that do not support imageSrcSet by making their preloads not work
                // but this population is shrinking fast and is already small so we accept this tradeoff.
                href: as === "image" && options && options.imageSrcSet ? undefined : href,
                as: as
            }, options);
            preloadPropsMap.set(key, preloadProps);
            if (null === ownerDocument.querySelector(preloadSelector)) {
                if (as === "style" && ownerDocument.querySelector(getStylesheetSelectorFromKey(key))) {
                    // We already have a stylesheet for this key. We don't need to preload it.
                    return;
                }
                else if (as === "script" && ownerDocument.querySelector(getScriptSelectorFromKey(key))) {
                    // We already have a stylesheet for this key. We don't need to preload it.
                    return;
                }
                var instance = ownerDocument.createElement("link");
                (0, ReactDOMComponent_1.setInitialProperties)(instance, "link", preloadProps);
                (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
                ownerDocument.head.appendChild(instance);
            }
        }
    }
}
function preloadModule(href, options) {
    if (!react_feature_flags_1.enableFloat) {
        return;
    }
    var ownerDocument = getDocumentForImperativeFloatMethods();
    if (href) {
        var as = options && typeof options.as === "string" ? options.as : "script";
        var preloadSelector = "link[rel=\"modulepreload\"][as=\"".concat((0, escapeSelectorAttributeValueInsideDoubleQuotes_1.default)(as), "\"][href=\"").concat((0, escapeSelectorAttributeValueInsideDoubleQuotes_1.default)(href), "\"]");
        // Some preloads are keyed under their selector. This happens when the preload is for
        // an arbitrary type. Other preloads are keyed under the resource key they represent a preload for.
        // Here we figure out which key to use to determine if we have a preload already.
        var key = preloadSelector;
        switch (as) {
            case "audioworklet":
            case "paintworklet":
            case "serviceworker":
            case "sharedworker":
            case "worker":
            case "script": {
                key = getScriptKey(href);
                break;
            }
        }
        if (!preloadPropsMap.has(key)) {
            var props = Object.assign({
                rel: "modulepreload",
                href: href
            }, options);
            preloadPropsMap.set(key, props);
            if (null === ownerDocument.querySelector(preloadSelector)) {
                switch (as) {
                    case "audioworklet":
                    case "paintworklet":
                    case "serviceworker":
                    case "sharedworker":
                    case "worker":
                    case "script": {
                        if (ownerDocument.querySelector(getScriptSelectorFromKey(key))) {
                            return;
                        }
                    }
                }
                var instance = ownerDocument.createElement("link");
                (0, ReactDOMComponent_1.setInitialProperties)(instance, "link", props);
                (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
                ownerDocument.head.appendChild(instance);
            }
        }
    }
}
function preinitStyle(href, precedence, options) {
    if (!react_feature_flags_1.enableFloat) {
        return;
    }
    var ownerDocument = getDocumentForImperativeFloatMethods();
    if (href) {
        var styles = (0, ReactDOMComponentTree_1.getResourcesFromRoot)(ownerDocument).hoistableStyles;
        var key = getStyleKey(href);
        precedence = precedence || "default";
        // Check if this resource already exists
        var resource = styles.get(key);
        if (resource) {
            // We can early return. The resource exists and there is nothing
            // more to do
            return;
        }
        var state_1 = {
            loading: NotLoaded,
            preload: null
        };
        // Attempt to hydrate instance from DOM
        var instance = ownerDocument.querySelector(getStylesheetSelectorFromKey(key));
        if (instance) {
            state_1.loading = Loaded | Inserted;
        }
        else {
            // Construct a new instance and insert it
            var stylesheetProps = Object.assign({
                rel: "stylesheet",
                href: href,
                "data-precedence": precedence
            }, options);
            var preloadProps = preloadPropsMap.get(key);
            if (preloadProps) {
                adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps);
            }
            var link_1 = instance = ownerDocument.createElement("link");
            (0, ReactDOMComponentTree_1.markNodeAsHoistable)(link_1);
            (0, ReactDOMComponent_1.setInitialProperties)(link_1, "link", stylesheetProps);
            link_1._p = new Promise(function (resolve, reject) {
                link_1.onload = resolve;
                link_1.onerror = reject;
            });
            link_1.addEventListener("load", function () {
                state_1.loading |= Loaded;
            });
            link_1.addEventListener("error", function () {
                state_1.loading |= Errored;
            });
            state_1.loading |= Inserted;
            insertStylesheet(instance, precedence, ownerDocument);
        }
        // Construct a Resource and cache it
        resource = {
            type: "stylesheet",
            instance: instance,
            count: 1,
            state: state_1
        };
        styles.set(key, resource);
        return;
    }
}
function preinitScript(src, options) {
    if (!react_feature_flags_1.enableFloat) {
        return;
    }
    var ownerDocument = getDocumentForImperativeFloatMethods();
    if (src) {
        var scripts = (0, ReactDOMComponentTree_1.getResourcesFromRoot)(ownerDocument).hoistableScripts;
        var key = getScriptKey(src);
        // Check if this resource already exists
        var resource = scripts.get(key);
        if (resource) {
            // We can early return. The resource exists and there is nothing
            // more to do
            return;
        }
        // Attempt to hydrate instance from DOM
        var instance = ownerDocument.querySelector(getScriptSelectorFromKey(key));
        if (!instance) {
            // Construct a new instance and insert it
            var scriptProps = Object.assign({
                src: src,
                async: true
            }, options);
            // Adopt certain preload props
            var preloadProps = preloadPropsMap.get(key);
            if (preloadProps) {
                adoptPreloadPropsForScript(scriptProps, preloadProps);
            }
            instance = ownerDocument.createElement("script");
            (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
            (0, ReactDOMComponent_1.setInitialProperties)(instance, "link", scriptProps);
            ownerDocument.head.appendChild(instance);
        }
        // Construct a Resource and cache it
        resource = {
            type: "script",
            instance: instance,
            count: 1,
            state: null
        };
        scripts.set(key, resource);
        return;
    }
}
function preinitModuleScript(src, options) {
    if (!react_feature_flags_1.enableFloat) {
        return;
    }
    var ownerDocument = getDocumentForImperativeFloatMethods();
    if (src) {
        var scripts = (0, ReactDOMComponentTree_1.getResourcesFromRoot)(ownerDocument).hoistableScripts;
        var key = getScriptKey(src);
        // Check if this resource already exists
        var resource = scripts.get(key);
        if (resource) {
            // We can early return. The resource exists and there is nothing
            // more to do
            return;
        }
        // Attempt to hydrate instance from DOM
        var instance = ownerDocument.querySelector(getScriptSelectorFromKey(key));
        if (!instance) {
            // Construct a new instance and insert it
            var scriptProps = Object.assign({
                src: src,
                async: true,
                type: "module"
            }, options);
            // Adopt certain preload props
            var preloadProps = preloadPropsMap.get(key);
            if (preloadProps) {
                adoptPreloadPropsForScript(scriptProps, preloadProps);
            }
            instance = ownerDocument.createElement("script");
            (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
            (0, ReactDOMComponent_1.setInitialProperties)(instance, "link", scriptProps);
            ownerDocument.head.appendChild(instance);
        }
        // Construct a Resource and cache it
        resource = {
            type: "script",
            instance: instance,
            count: 1,
            state: null
        };
        scripts.set(key, resource);
        return;
    }
}
// This function is called in begin work and we should always have a currentDocument set
function getResource(type, currentProps, pendingProps) {
    var resourceRoot = getCurrentResourceRoot();
    if (!resourceRoot) {
        throw new Error("\"resourceRoot\" was expected to exist. This is a bug in React.");
    }
    switch (type) {
        case "meta":
        case "title": {
            return null;
        }
        case "style": {
            if (typeof pendingProps.precedence === "string" && typeof pendingProps.href === "string") {
                var key = getStyleKey(pendingProps.href);
                var styles = (0, ReactDOMComponentTree_1.getResourcesFromRoot)(resourceRoot).hoistableStyles;
                var resource = styles.get(key);
                if (!resource) {
                    resource = {
                        type: "style",
                        instance: null,
                        count: 0,
                        state: null
                    };
                    styles.set(key, resource);
                }
                return resource;
            }
            return {
                type: "void",
                instance: null,
                count: 0,
                state: null
            };
        }
        case "link": {
            if (pendingProps.rel === "stylesheet" && typeof pendingProps.href === "string" && typeof pendingProps.precedence === "string") {
                var qualifiedProps = pendingProps;
                var key = getStyleKey(qualifiedProps.href);
                var styles = (0, ReactDOMComponentTree_1.getResourcesFromRoot)(resourceRoot).hoistableStyles;
                var resource = styles.get(key);
                if (!resource) {
                    // We asserted this above but Flow can't figure out that the type satisfies
                    var ownerDocument = getDocumentFromRoot(resourceRoot);
                    resource = {
                        type: "stylesheet",
                        instance: null,
                        count: 0,
                        state: {
                            loading: NotLoaded,
                            preload: null
                        }
                    };
                    styles.set(key, resource);
                    if (!preloadPropsMap.has(key)) {
                        // @ts-ignore
                        preloadStylesheet(ownerDocument, key, preloadPropsFromStylesheet(qualifiedProps), resource.state);
                    }
                }
                return resource;
            }
            return null;
        }
        case "script": {
            if (typeof pendingProps.src === "string" && pendingProps.async === true) {
                var scriptProps = pendingProps;
                var key = getScriptKey(scriptProps.src);
                var scripts = (0, ReactDOMComponentTree_1.getResourcesFromRoot)(resourceRoot).hoistableScripts;
                var resource = scripts.get(key);
                if (!resource) {
                    resource = {
                        type: "script",
                        instance: null,
                        count: 0,
                        state: null
                    };
                    scripts.set(key, resource);
                }
                return resource;
            }
            return {
                type: "void",
                instance: null,
                count: 0,
                state: null
            };
        }
        default: {
            throw new Error("getResource encountered a type it did not expect: \"".concat(type, "\". this is a bug in React."));
        }
    }
}
exports.getResource = getResource;
function styleTagPropsFromRawProps(rawProps) {
    return __assign(__assign({}, rawProps), { "data-href": rawProps.href, "data-precedence": rawProps.precedence, href: null, precedence: null });
}
function getStyleKey(href) {
    var limitedEscapedHref = (0, escapeSelectorAttributeValueInsideDoubleQuotes_1.default)(href);
    return "href=\"".concat(limitedEscapedHref, "\"");
}
function getStyleTagSelector(href) {
    var limitedEscapedHref = (0, escapeSelectorAttributeValueInsideDoubleQuotes_1.default)(href);
    return "style[data-href~=\"".concat(limitedEscapedHref, "\"]");
}
function getStylesheetSelectorFromKey(key) {
    return "link[rel=\"stylesheet\"][".concat(key, "]");
}
function getPreloadStylesheetSelectorFromKey(key) {
    return "link[rel=\"preload\"][as=\"style\"][".concat(key, "]");
}
function stylesheetPropsFromRawProps(rawProps) {
    return __assign(__assign({}, rawProps), { "data-precedence": rawProps.precedence, precedence: null });
}
function preloadStylesheet(ownerDocument, key, preloadProps, state) {
    preloadPropsMap.set(key, preloadProps);
    if (!ownerDocument.querySelector(getStylesheetSelectorFromKey(key))) {
        // There is no matching stylesheet instance in the Document.
        // We will insert a preload now to kick off loading because
        // we expect this stylesheet to commit
        var preloadEl = ownerDocument.querySelector(getPreloadStylesheetSelectorFromKey(key));
        if (preloadEl) {
            // If we find a preload already it was SSR'd and we won't have an actual
            // loading state to track. For now we will just assume it is loaded
            state.loading = Loaded;
        }
        else {
            var instance = ownerDocument.createElement("link");
            state.preload = instance;
            instance.addEventListener("load", function () { return state.loading |= Loaded; });
            instance.addEventListener("error", function () { return state.loading |= Errored; });
            (0, ReactDOMComponent_1.setInitialProperties)(instance, "link", preloadProps);
            (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
            ownerDocument.head.appendChild(instance);
        }
    }
}
function preloadPropsFromStylesheet(props) {
    return {
        rel: "preload",
        as: "style",
        href: props.href,
        crossOrigin: props.crossOrigin,
        integrity: props.integrity,
        media: props.media,
        hrefLang: props.hrefLang,
        referrerPolicy: props.referrerPolicy
    };
}
function getScriptKey(src) {
    var limitedEscapedSrc = (0, escapeSelectorAttributeValueInsideDoubleQuotes_1.default)(src);
    return "[src=\"".concat(limitedEscapedSrc, "\"]");
}
function getScriptSelectorFromKey(key) {
    return "script[async]" + key;
}
function acquireResource(hoistableRoot, resource, props) {
    resource.count++;
    if (resource.instance === null) {
        switch (resource.type) {
            case "style": {
                var qualifiedProps = props;
                // Attempt to hydrate instance from DOM
                var instance = hoistableRoot.querySelector(getStyleTagSelector(qualifiedProps.href));
                if (instance) {
                    resource.instance = instance;
                    (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
                    return instance;
                }
                var styleProps = styleTagPropsFromRawProps(props);
                var ownerDocument = getDocumentFromRoot(hoistableRoot);
                // @ts-ignore
                instance = ownerDocument.createElement("style");
                (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
                (0, ReactDOMComponent_1.setInitialProperties)(instance, "style", styleProps);
                // TODO: `style` does not have loading state for tracking insertions. I
                // guess because these aren't suspensey? Not sure whether this is a
                // factoring smell.
                // resource.state.loading |= Inserted;
                insertStylesheet(instance, qualifiedProps.precedence, hoistableRoot);
                resource.instance = instance;
                return instance;
            }
            case "stylesheet": {
                // This typing is enforce by `getResource`. If we change the logic
                // there for what qualifies as a stylesheet resource we need to ensure
                // this cast still makes sense;
                var qualifiedProps = props;
                var key = getStyleKey(qualifiedProps.href);
                // Attempt to hydrate instance from DOM
                var instance = hoistableRoot.querySelector(getStylesheetSelectorFromKey(key));
                if (instance) {
                    resource.state.loading |= Inserted;
                    resource.instance = instance;
                    (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
                    return instance;
                }
                var stylesheetProps = stylesheetPropsFromRawProps(props);
                var preloadProps = preloadPropsMap.get(key);
                if (preloadProps) {
                    adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps);
                }
                // Construct and insert a new instance
                var ownerDocument = getDocumentFromRoot(hoistableRoot);
                // @ts-ignore
                instance = ownerDocument.createElement("link");
                (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
                var linkInstance_1 = instance;
                linkInstance_1._p = new Promise(function (resolve, reject) {
                    linkInstance_1.onload = resolve;
                    linkInstance_1.onerror = reject;
                });
                (0, ReactDOMComponent_1.setInitialProperties)(instance, "link", stylesheetProps);
                resource.state.loading |= Inserted;
                insertStylesheet(instance, qualifiedProps.precedence, hoistableRoot);
                resource.instance = instance;
                return instance;
            }
            case "script": {
                // This typing is enforce by `getResource`. If we change the logic
                // there for what qualifies as a stylesheet resource we need to ensure
                // this cast still makes sense;
                var borrowedScriptProps = props;
                var key = getScriptKey(borrowedScriptProps.src);
                // Attempt to hydrate instance from DOM
                var instance = hoistableRoot.querySelector(getScriptSelectorFromKey(key));
                if (instance) {
                    resource.instance = instance;
                    (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
                    return instance;
                }
                var scriptProps = borrowedScriptProps;
                var preloadProps = preloadPropsMap.get(key);
                if (preloadProps) {
                    scriptProps = __assign({}, borrowedScriptProps);
                    adoptPreloadPropsForScript(scriptProps, preloadProps);
                }
                // Construct and insert a new instance
                var ownerDocument = getDocumentFromRoot(hoistableRoot);
                // @ts-ignore
                instance = ownerDocument.createElement("script");
                (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
                (0, ReactDOMComponent_1.setInitialProperties)(instance, "link", scriptProps);
                ownerDocument.head.appendChild(instance);
                resource.instance = instance;
                return instance;
            }
            case "void": {
                return null;
            }
            default: {
                // @ts-ignore
                throw new Error("acquireResource encountered a resource type it did not expect: \"".concat(resource.type, "\". this is a bug in React."));
            }
        }
    }
    else {
        // In the case of stylesheets, they might have already been assigned an
        // instance during `suspendResource`. But that doesn't mean they were
        // inserted, because the commit might have been interrupted. So we need to
        // check now.
        //
        // The other resource types are unaffected because they are not
        // yet suspensey.
        //
        // TODO: This is a bit of a code smell. Consider refactoring how
        // `suspendResource` and `acquireResource` work together. The idea is that
        // `suspendResource` does all the same stuff as `acquireResource` except
        // for the insertion.
        if (resource.type === "stylesheet" && (resource.state.loading & Inserted) === NotLoaded) {
            var qualifiedProps = props;
            var instance = resource.instance;
            resource.state.loading |= Inserted;
            insertStylesheet(instance, qualifiedProps.precedence, hoistableRoot);
        }
    }
    return resource.instance;
}
exports.acquireResource = acquireResource;
function releaseResource(resource) {
    resource.count--;
}
exports.releaseResource = releaseResource;
function insertStylesheet(instance, precedence, root) {
    var nodes = root.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]");
    var last = nodes.length ? nodes[nodes.length - 1] : null;
    var prior = last;
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        // @ts-ignore
        var nodePrecedence = node.dataset.precedence;
        if (nodePrecedence === precedence) {
            prior = node;
        }
        else if (prior !== last) {
            break;
        }
    }
    if (prior) {
        // We get the prior from the document so we know it is in the tree.
        // We also know that links can't be the topmost Node so the parentNode
        // must exist.
        prior.parentNode.insertBefore(instance, prior.nextSibling);
    }
    else {
        var parent_1 = root.nodeType === HTMLNodeType_1.DOCUMENT_NODE ? root.head : root;
        parent_1.insertBefore(instance, parent_1.firstChild);
    }
}
function adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps) {
    if (stylesheetProps.crossOrigin == null)
        stylesheetProps.crossOrigin = preloadProps.crossOrigin;
    if (stylesheetProps.referrerPolicy == null)
        stylesheetProps.referrerPolicy = preloadProps.referrerPolicy;
    if (stylesheetProps.title == null)
        stylesheetProps.title = preloadProps.title;
}
function adoptPreloadPropsForScript(scriptProps, preloadProps) {
    if (scriptProps.crossOrigin == null)
        scriptProps.crossOrigin = preloadProps.crossOrigin;
    if (scriptProps.referrerPolicy == null)
        scriptProps.referrerPolicy = preloadProps.referrerPolicy;
    if (scriptProps.integrity == null)
        scriptProps.integrity = preloadProps.integrity;
}
var tagCaches = null;
function hydrateHoistable(hoistableRoot, type, props, internalInstanceHandle /* Object */) {
    var ownerDocument = getDocumentFromRoot(hoistableRoot);
    var instance = null;
    getInstance: switch (type) {
        case "title": {
            // @ts-ignore
            instance = ownerDocument.getElementsByTagName("title")[0];
            if (!instance || (0, ReactDOMComponentTree_1.isOwnedInstance)(instance) || instance.namespaceURI === DOMNamespaces_1.SVG_NAMESPACE || instance.hasAttribute("itemprop")) {
                // @ts-ignore
                instance = ownerDocument.createElement(type);
                ownerDocument.head.insertBefore(instance, ownerDocument.querySelector("head > title"));
            }
            (0, ReactDOMComponent_1.setInitialProperties)(instance, type, props);
            (0, ReactDOMComponentTree_1.precacheFiberNode)(internalInstanceHandle, instance);
            (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
            return instance;
        }
        case "link": {
            // @ts-ignore
            var cache = getHydratableHoistableCache("link", "href", ownerDocument);
            var key = type + (props.href || "");
            var maybeNodes = cache.get(key);
            if (maybeNodes) {
                var nodes = maybeNodes;
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    if (node.getAttribute("href") !== (props.href == null ? null : props.href) || node.getAttribute("rel") !== (props.rel == null ? null : props.rel) || node.getAttribute("title") !== (props.title == null ? null : props.title) || node.getAttribute("crossorigin") !== (props.crossOrigin == null ? null : props.crossOrigin)) {
                        // mismatch, try the next node;
                        continue;
                    }
                    instance = node;
                    nodes.splice(i, 1);
                    break getInstance;
                }
            }
            // @ts-ignore
            instance = ownerDocument.createElement(type);
            (0, ReactDOMComponent_1.setInitialProperties)(instance, type, props);
            ownerDocument.head.appendChild(instance);
            break;
        }
        case "meta": {
            // @ts-ignore
            var cache = getHydratableHoistableCache("meta", "content", ownerDocument);
            var key = type + (props.content || "");
            var maybeNodes = cache.get(key);
            if (maybeNodes) {
                var nodes = maybeNodes;
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    // We coerce content to string because it is the most likely one to
                    // use a `toString` capable value. For the rest we just do identity match
                    // passing non-strings here is not really valid anyway.
                    if (__DEV__) {
                        (0, check_string_coercion_1.checkAttributeStringCoercion)(props.content, "content");
                    }
                    if (node.getAttribute("content") !== (props.content == null ? null : "" + props.content) || node.getAttribute("name") !== (props.name == null ? null : props.name) || node.getAttribute("property") !== (props.property == null ? null : props.property) || node.getAttribute("http-equiv") !== (props.httpEquiv == null ? null : props.httpEquiv) || node.getAttribute("charset") !== (props.charSet == null ? null : props.charSet)) {
                        // mismatch, try the next node;
                        continue;
                    }
                    instance = node;
                    nodes.splice(i, 1);
                    break getInstance;
                }
            }
            // @ts-ignore
            instance = ownerDocument.createElement(type);
            (0, ReactDOMComponent_1.setInitialProperties)(instance, type, props);
            ownerDocument.head.appendChild(instance);
            break;
        }
        default:
            throw new Error("getNodesForType encountered a type it did not expect: \"".concat(type, "\". This is a bug in React."));
    }
    // This node is a match
    (0, ReactDOMComponentTree_1.precacheFiberNode)(internalInstanceHandle, instance);
    (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
    return instance;
}
exports.hydrateHoistable = hydrateHoistable;
function getHydratableHoistableCache(type, keyAttribute, ownerDocument) {
    var cache;
    var caches;
    if (tagCaches === null) {
        cache = new Map();
        caches = tagCaches = new Map();
        caches.set(ownerDocument, cache);
    }
    else {
        caches = tagCaches;
        var maybeCache = caches.get(ownerDocument);
        if (!maybeCache) {
            cache = new Map();
            caches.set(ownerDocument, cache);
        }
        else {
            cache = maybeCache;
        }
    }
    if (cache.has(type)) {
        // We use type as a special key that signals that this cache has been seeded for this type
        return cache;
    }
    // Mark this cache as seeded for this type
    cache.set(type, null);
    var nodes = ownerDocument.getElementsByTagName(type);
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (!(0, ReactDOMComponentTree_1.isOwnedInstance)(node) && (type !== "link" || node.getAttribute("rel") !== "stylesheet") && node.namespaceURI !== DOMNamespaces_1.SVG_NAMESPACE) {
            var nodeKey = node.getAttribute(keyAttribute) || "";
            var key = type + nodeKey;
            var existing = cache.get(key);
            if (existing) {
                existing.push(node);
            }
            else {
                cache.set(key, [node]);
            }
        }
    }
    return cache;
}
function mountHoistable(hoistableRoot, type, instance) {
    var ownerDocument = getDocumentFromRoot(hoistableRoot);
    ownerDocument.head.insertBefore(instance, type === "title" ? ownerDocument.querySelector("head > title") : null);
}
exports.mountHoistable = mountHoistable;
function unmountHoistable(instance) {
    instance.parentNode.removeChild(instance);
}
exports.unmountHoistable = unmountHoistable;
function isHostHoistableType(type, props, hostContext) {
    var outsideHostContainerContext = false;
    var hostContextProd;
    if (__DEV__) {
        var hostContextDev = hostContext;
        // We can only render resources when we are not within the host container context
        outsideHostContainerContext = !hostContextDev.ancestorInfo.containerTagInScope;
        hostContextProd = hostContextDev.context;
    }
    else {
        hostContextProd = hostContext;
    }
    // Global opt out of hoisting for anything in SVG Namespace or anything with an itemProp inside an itemScope
    if (hostContextProd === react_fiber_config_host_context_namespace_1.HostContextNamespaceMode.HostContextNamespaceSvg || props.itemProp != null) {
        if (__DEV__) {
            if (outsideHostContainerContext && props.itemProp != null && (type === "meta" || type === "title" || type === "style" || type === "link" || type === "script")) {
                console.error("Cannot render a <%s> outside the main document if it has an `itemProp` prop. `itemProp` suggests the tag belongs to an" + " `itemScope` which can appear anywhere in the DOM. If you were intending for React to hoist this <%s> remove the `itemProp` prop." + " Otherwise, try moving this tag into the <head> or <body> of the Document.", type, type);
            }
        }
        return false;
    }
    switch (type) {
        case "meta":
        case "title": {
            return true;
        }
        case "style": {
            if (typeof props.precedence !== "string" || typeof props.href !== "string" || props.href === "") {
                if (__DEV__) {
                    if (outsideHostContainerContext) {
                        console.error("Cannot render a <style> outside the main document without knowing its precedence and a unique href key." + " React can hoist and deduplicate <style> tags if you provide a `precedence` prop along with an `href` prop that" + " does not conflic with the `href` values used in any other hoisted <style> or <link rel=\"stylesheet\" ...> tags. " + " Note that hoisting <style> tags is considered an advanced feature that most will not use directly." + " Consider moving the <style> tag to the <head> or consider adding a `precedence=\"default\"` and `href=\"some unique resource identifier\"`, or move the <style>" + " to the <style> tag.");
                    }
                }
                return false;
            }
            return true;
        }
        case "link": {
            if (typeof props.rel !== "string" || typeof props.href !== "string" || props.href === "" || props.onLoad || props.onError) {
                if (__DEV__) {
                    if (props.rel === "stylesheet" && typeof props.precedence === "string") {
                        (0, ReactDOMResourceValidation_1.validateLinkPropsForStyleResource)(props);
                    }
                    if (outsideHostContainerContext) {
                        if (typeof props.rel !== "string" || typeof props.href !== "string" || props.href === "") {
                            console.error("Cannot render a <link> outside the main document without a `rel` and `href` prop." + " Try adding a `rel` and/or `href` prop to this <link> or moving the link into the <head> tag");
                        }
                        else if (props.onError || props.onLoad) {
                            console.error("Cannot render a <link> with onLoad or onError listeners outside the main document." + " Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or" + " somewhere in the <body>.");
                        }
                    }
                }
                return false;
            }
            switch (props.rel) {
                case "stylesheet": {
                    var precedence = props.precedence, disabled = props.disabled;
                    if (__DEV__) {
                        if (typeof precedence !== "string") {
                            if (outsideHostContainerContext) {
                                console.error("Cannot render a <link rel=\"stylesheet\" /> outside the main document without knowing its precedence." + " Consider adding precedence=\"default\" or moving it into the root <head> tag.");
                            }
                        }
                    }
                    return typeof precedence === "string" && disabled == null;
                }
                default: {
                    return true;
                }
            }
        }
        case "script": {
            if (props.async !== true || props.onLoad || props.onError || typeof props.src !== "string" || !props.src) {
                if (__DEV__) {
                    if (outsideHostContainerContext) {
                        if (props.async !== true) {
                            console.error("Cannot render a sync or defer <script> outside the main document without knowing its order." + " Try adding async=\"\" or moving it into the root <head> tag.");
                        }
                        else if (props.onLoad || props.onError) {
                            console.error("Cannot render a <script> with onLoad or onError listeners outside the main document." + " Try removing onLoad={...} and onError={...} or moving it into the root <head> tag or" + " somewhere in the <body>.");
                        }
                        else {
                            console.error("Cannot render a <script> outside the main document without `async={true}` and a non-empty `src` prop." + " Ensure there is a valid `src` and either make the script async or move it into the root <head> tag or" + " somewhere in the <body>.");
                        }
                    }
                }
                return false;
            }
            return true;
        }
        case "noscript":
        case "template": {
            if (__DEV__) {
                if (outsideHostContainerContext) {
                    console.error("Cannot render <%s> outside the main document. Try moving it into the root <head> tag.", type);
                }
            }
            return false;
        }
    }
    return false;
}
exports.isHostHoistableType = isHostHoistableType;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function maySuspendCommit(type, props) {
    return false;
}
exports.maySuspendCommit = maySuspendCommit;
function mayResourceSuspendCommit(resource) {
    return resource.type === "stylesheet" && (resource.state.loading & Inserted) === NotLoaded;
}
exports.mayResourceSuspendCommit = mayResourceSuspendCommit;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function preloadInstance(type, props) {
    // Return true to indicate it's already loaded
    return true;
}
exports.preloadInstance = preloadInstance;
function preloadResource(resource) {
    if (resource.type === "stylesheet" && (resource.state.loading & Settled) === NotLoaded) {
        // we have not finished loading the underlying stylesheet yet.
        return false;
    }
    // Return true to indicate it's already loaded
    return true;
}
exports.preloadResource = preloadResource;
var suspendedState = null;
// We use a noop function when we begin suspending because if possible we want the
// waitfor step to finish synchronously. If it doesn't we'll return a function to
// provide the actual unsuspend function and that will get completed when the count
// hits zero or it will get cancelled if the root starts new work.
function noop() {
}
function startSuspendingCommit() {
    suspendedState = {
        stylesheets: null,
        count: 0,
        unsuspend: noop
    };
}
exports.startSuspendingCommit = startSuspendingCommit;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function suspendInstance(type, props) {
    return;
}
exports.suspendInstance = suspendInstance;
function suspendResource(hoistableRoot, resource, props) {
    if (suspendedState === null) {
        throw new Error("Internal React Error: suspendedState null when it was expected to exists. Please report this as a React bug.");
    }
    var state = suspendedState;
    if (resource.type === "stylesheet") {
        if (typeof props.media === "string") {
            // If we don't currently match media we avoid suspending on this resource
            // and let it insert on the mutation path
            if (matchMedia(props.media).matches === false) {
                return;
            }
        }
        if ((resource.state.loading & Inserted) === NotLoaded) {
            if (resource.instance === null) {
                var qualifiedProps = props;
                var key = getStyleKey(qualifiedProps.href);
                // Attempt to hydrate instance from DOM
                var instance = hoistableRoot.querySelector(getStylesheetSelectorFromKey(key));
                if (instance) {
                    // If this instance has a loading state it came from the Fizz runtime.
                    // If there is not loading state it is assumed to have been server rendered
                    // as part of the preamble and therefore synchronously loaded. It could have
                    // errored however which we still do not yet have a means to detect. For now
                    // we assume it is loaded.
                    var maybeLoadingState = instance._p;
                    if (maybeLoadingState !== null && typeof maybeLoadingState === "object" && // $FlowFixMe[method-unbinding]
                        typeof maybeLoadingState.then === "function") {
                        var loadingState = maybeLoadingState;
                        state.count++;
                        var ping = onUnsuspend.bind(state);
                        loadingState.then(ping, ping);
                    }
                    resource.state.loading |= Inserted;
                    resource.instance = instance;
                    (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
                    return;
                }
                var ownerDocument = getDocumentFromRoot(hoistableRoot);
                var stylesheetProps = stylesheetPropsFromRawProps(props);
                var preloadProps = preloadPropsMap.get(key);
                if (preloadProps) {
                    adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps);
                }
                // Construct and insert a new instance
                // @ts-ignore
                instance = ownerDocument.createElement("link");
                (0, ReactDOMComponentTree_1.markNodeAsHoistable)(instance);
                var linkInstance_2 = instance;
                // This Promise is a loading state used by the Fizz runtime. We need this incase there is a race
                // between this resource being rendered on the client and being rendered with a late completed boundary.
                linkInstance_2._p = new Promise(function (resolve, reject) {
                    linkInstance_2.onload = resolve;
                    linkInstance_2.onerror = reject;
                });
                (0, ReactDOMComponent_1.setInitialProperties)(instance, "link", stylesheetProps);
                resource.instance = instance;
            }
            if (state.stylesheets === null) {
                state.stylesheets = new Map();
            }
            state.stylesheets.set(resource, hoistableRoot);
            var preloadEl = resource.state.preload;
            if (preloadEl && (resource.state.loading & Settled) === NotLoaded) {
                state.count++;
                var ping = onUnsuspend.bind(state);
                preloadEl.addEventListener("load", ping);
                preloadEl.addEventListener("error", ping);
            }
        }
    }
}
exports.suspendResource = suspendResource;
function waitForCommitToBeReady() {
    if (suspendedState === null) {
        throw new Error("Internal React Error: suspendedState null when it was expected to exists. Please report this as a React bug.");
    }
    var state = suspendedState;
    if (state.stylesheets && state.count === 0) {
        // We are not currently blocked but we have not inserted all stylesheets.
        // If this insertion happens and loads or errors synchronously then we can
        // avoid suspending the commit. To do this we check the count again immediately after
        insertSuspendedStylesheets(state, state.stylesheets);
    }
    // We need to check the count again because the inserted stylesheets may have led to new
    // tasks to wait on.
    if (state.count > 0) {
        return function (commit) {
            // We almost never want to show content before its styles have loaded. But
            // eventually we will give up and allow unstyled content. So this number is
            // somewhat arbitrary — big enough that you'd only reach it under
            // extreme circumstances.
            // TODO: Figure out what the browser engines do during initial page load and
            // consider aligning our behavior with that.
            var stylesheetTimer = setTimeout(function () {
                if (state.stylesheets) {
                    insertSuspendedStylesheets(state, state.stylesheets);
                }
                if (state.unsuspend) {
                    var unsuspend = state.unsuspend;
                    state.unsuspend = null;
                    unsuspend();
                }
            }, 60000);
            // one minute
            state.unsuspend = commit;
            return function () {
                state.unsuspend = null;
                clearTimeout(stylesheetTimer);
            };
        };
    }
    return null;
}
exports.waitForCommitToBeReady = waitForCommitToBeReady;
function onUnsuspend() {
    this.count--;
    if (this.count === 0) {
        if (this.stylesheets) {
            // If we haven't actually inserted the stylesheets yet we need to do so now before starting the commit.
            // The reason we do this after everything else has finished is because we want to have all the stylesheets
            // load synchronously right before mutating. Ideally the new styles will cause a single recalc only on the
            // new tree. When we filled up stylesheets we only inlcuded stylesheets with matching media attributes so we
            // wait for them to load before actually continuing. We expect this to increase the count above zero
            insertSuspendedStylesheets(this, this.stylesheets);
        }
        else if (this.unsuspend) {
            var unsuspend = this.unsuspend;
            this.unsuspend = null;
            unsuspend();
        }
    }
}
// This is typecast to non-null because it will always be set before read.
// it is important that this not be used except when the stack guarantees it exists.
// Currentlyt his is only during insertSuspendedStylesheet.
var precedencesByRoot = null;
function insertSuspendedStylesheets(state, resources) {
    // We need to clear this out so we don't try to reinsert after the stylesheets have loaded
    state.stylesheets = null;
    if (state.unsuspend === null) {
        // The suspended commit was cancelled. We don't need to insert any stylesheets.
        return;
    }
    // Temporarily increment count. we don't want any synchronously loaded stylesheets to try to unsuspend
    // before we finish inserting all stylesheets.
    state.count++;
    precedencesByRoot = new Map();
    resources.forEach(insertStylesheetIntoRoot, state);
    precedencesByRoot = null;
    // We can remove our temporary count and if we're still at zero we can unsuspend.
    // If we are in the synchronous phase before deciding if the commit should suspend and this
    // ends up hitting the unsuspend path it will just invoke the noop unsuspend.
    onUnsuspend.call(state);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function insertStylesheetIntoRoot(root, resource, map) {
    if (resource.state.loading & Inserted) {
        // This resource was inserted by another root committing. we don't need to insert it again
        return;
    }
    var last;
    var precedences = precedencesByRoot.get(root);
    if (!precedences) {
        precedences = new Map();
        precedencesByRoot.set(root, precedences);
        var nodes = root.querySelectorAll("link[data-precedence],style[data-precedence]");
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.nodeName === "link" || // We omit style tags with media="not all" because they are not in the right position
                // and will be hoisted by the Fizz runtime imminently.
                node.getAttribute("media") !== "not all") {
                // @ts-ignore
                precedences.set("p" + node.dataset.precedence, node);
                last = node;
            }
        }
        if (last) {
            precedences.set("last", last);
        }
    }
    else {
        last = precedences.get("last");
    }
    // We only call this after we have constructed an instance so we assume it here
    var instance = resource.instance;
    // We will always have a precedence for stylesheet instances
    var precedence = instance.getAttribute("data-precedence");
    var prior = precedences.get("p" + precedence) || last;
    if (prior === last) {
        precedences.set("last", instance);
    }
    precedences.set(precedence, instance);
    this.count++;
    var onComplete = onUnsuspend.bind(this);
    instance.addEventListener("load", onComplete);
    instance.addEventListener("error", onComplete);
    if (prior) {
        prior.parentNode.insertBefore(instance, prior.nextSibling);
    }
    else {
        var parent_2 = root.nodeType === HTMLNodeType_1.DOCUMENT_NODE ? root.head : root;
        parent_2.insertBefore(instance, parent_2.firstChild);
    }
    resource.state.loading |= Inserted;
}
exports.NotPendingTransition = ReactDOMFormActions_1.NotPending;
