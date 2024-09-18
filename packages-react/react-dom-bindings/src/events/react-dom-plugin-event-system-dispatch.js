"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchEventForPluginEventSystem = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
var EventSystemFlags_1 = require("@zenflux/react-dom-bindings/src/events/EventSystemFlags");
var ReactDOMUpdateBatching_1 = require("@zenflux/react-dom-bindings/src/events/ReactDOMUpdateBatching");
var HTMLNodeType_1 = require("@zenflux/react-dom-bindings/src/client/HTMLNodeType");
var getEventTarget_1 = require("@zenflux/react-dom-bindings/src/events/getEventTarget");
var react_dom_plugin_event_system_dispatch_extract_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-dispatch-extract");
var react_dom_plugin_event_system_process_dispatch_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-process-dispatch");
function isMatchingRootContainer(grandContainer, targetContainer) {
    return grandContainer === targetContainer || grandContainer.nodeType === HTMLNodeType_1.COMMENT_NODE && grandContainer.parentNode === targetContainer;
}
function dispatchEventsForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
    var nativeEventTarget = (0, getEventTarget_1.default)(nativeEvent);
    var dispatchQueue = [];
    (0, react_dom_plugin_event_system_dispatch_extract_1.extractEvents)(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
    (0, react_dom_plugin_event_system_process_dispatch_1.processDispatchQueue)(dispatchQueue, eventSystemFlags);
}
function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
    var ancestorInst = targetInst;
    if ((eventSystemFlags & EventSystemFlags_1.IS_EVENT_HANDLE_NON_MANAGED_NODE) === 0 && (eventSystemFlags & EventSystemFlags_1.IS_NON_DELEGATED) === 0) {
        var targetContainerNode = targetContainer;
        if (targetInst !== null) {
            // The below logic attempts to work out if we need to change
            // the target fiber to a different ancestor. We had similar logic
            // in the legacy event system, except the big difference between
            // systems is that the modern event system now has an event listener
            // attached to each React Root and React Portal Root. Together,
            // the DOM nodes representing these roots are the "rootContainer".
            // To figure out which ancestor instance we should use, we traverse
            // up the fiber tree from the target instance and attempt to find
            // root boundaries that match that of our current "rootContainer".
            // If we find that "rootContainer", we find the parent fiber
            // sub-tree for that root and make that our ancestor instance.
            var node = targetInst;
            mainLoop: while (true) {
                if (node === null) {
                    return;
                }
                var nodeTag = node.tag;
                if (nodeTag === work_tags_1.WorkTag.HostRoot || nodeTag === work_tags_1.WorkTag.HostPortal) {
                    var container = node.stateNode.containerInfo;
                    if (isMatchingRootContainer(container, targetContainerNode)) {
                        break;
                    }
                    if (nodeTag === work_tags_1.WorkTag.HostPortal) {
                        // The target is a portal, but it's not the rootContainer we're looking for.
                        // Normally portals handle their own events all the way down to the root.
                        // So we should be able to stop now. However, we don't know if this portal
                        // was part of *our* root.
                        var grandNode = node.return;
                        while (grandNode !== null) {
                            var grandTag = grandNode.tag;
                            if (grandTag === work_tags_1.WorkTag.HostRoot || grandTag === work_tags_1.WorkTag.HostPortal) {
                                var grandContainer = grandNode.stateNode.containerInfo;
                                if (isMatchingRootContainer(grandContainer, targetContainerNode)) {
                                    // This is the rootContainer we're looking for and we found it as
                                    // a parent of the Portal. That means we can ignore it because the
                                    // Portal will bubble through to us.
                                    return;
                                }
                            }
                            grandNode = grandNode.return;
                        }
                    }
                    // Now we need to find it's corresponding host fiber in the other
                    // tree. To do this we can use getClosestInstanceFromNode, but we
                    // need to validate that the fiber is a host instance, otherwise
                    // we need to traverse up through the DOM till we find the correct
                    // node that is from the other tree.
                    while (container !== null) {
                        var parentNode = (0, ReactDOMComponentTree_1.getClosestInstanceFromNode)(container);
                        if (parentNode === null) {
                            return;
                        }
                        var parentTag = parentNode.tag;
                        if (parentTag === work_tags_1.WorkTag.HostComponent || parentTag === work_tags_1.WorkTag.HostText || (react_feature_flags_1.enableFloat ? parentTag === work_tags_1.WorkTag.HostHoistable : false) || (react_feature_flags_1.enableHostSingletons ? parentTag === work_tags_1.WorkTag.HostSingleton : false)) {
                            node = ancestorInst = parentNode;
                            continue mainLoop;
                        }
                        container = container.parentNode;
                    }
                }
                node = node.return;
            }
        }
    }
    (0, ReactDOMUpdateBatching_1.batchedUpdates)(function () { return dispatchEventsForPlugins(domEventName, eventSystemFlags, nativeEvent, ancestorInst, targetContainer); });
}
exports.dispatchEventForPluginEventSystem = dispatchEventForPluginEventSystem;
