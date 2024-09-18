"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accumulateTwoPhaseListeners = exports.accumulateSinglePhaseListeners = exports.accumulateEventHandleNonManagedNodeListeners = exports.accumulateEnterLeaveTwoPhaseListeners = void 0;
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var getListener_1 = require("@zenflux/react-dom-bindings/src/events/getListener");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
function createDispatchListener(instance, listener, currentTarget) {
    return {
        instance: instance,
        listener: listener,
        currentTarget: currentTarget
    };
}
function getParent(inst) {
    if (inst === null) {
        return null;
    }
    do {
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        inst = inst.return; // TODO: If this is a WorkTag.HostRoot we might want to bail out.
        // That is depending on if we want nested subtrees (layers) to bubble
        // events to their parent. We could also go through parentNode on the
        // host node but that wouldn't work for React Native and doesn't let us
        // do the portal feature.
    } while (inst && inst.tag !== work_tags_1.WorkTag.HostComponent && (!react_feature_flags_1.enableHostSingletons ? true : inst.tag !== work_tags_1.WorkTag.HostSingleton));
    if (inst) {
        return inst;
    }
    return null;
}
/**
 * Return the lowest common ancestor of A and B, or null if they are in
 * different trees.
 */
function getLowestCommonAncestor(instA, instB) {
    var nodeA = instA;
    var nodeB = instB;
    var depthA = 0;
    for (var tempA = nodeA; tempA; tempA = getParent(tempA)) {
        depthA++;
    }
    var depthB = 0;
    for (var tempB = nodeB; tempB; tempB = getParent(tempB)) {
        depthB++;
    }
    // If A is deeper, crawl up.
    while (depthA - depthB > 0) {
        nodeA = getParent(nodeA);
        depthA--;
    }
    // If B is deeper, crawl up.
    while (depthB - depthA > 0) {
        nodeB = getParent(nodeB);
        depthB--;
    }
    // Walk in lockstep until we find a match.
    var depth = depthA;
    while (depth--) {
        if (nodeA === nodeB || nodeB !== null && nodeA === nodeB.alternate) {
            return nodeA;
        }
        nodeA = getParent(nodeA);
        nodeB = getParent(nodeB);
    }
    return null;
}
function accumulateEnterLeaveListenersForEvent(dispatchQueue, event, target, common, inCapturePhase) {
    var registrationName = event._reactName;
    var listeners = [];
    var instance = target;
    while (instance !== null) {
        if (instance === common) {
            break;
        }
        var alternate = instance.alternate, stateNode = instance.stateNode, tag = instance.tag;
        if (alternate !== null && alternate === common) {
            break;
        }
        if ((tag === work_tags_1.WorkTag.HostComponent || (react_feature_flags_1.enableFloat ? tag === work_tags_1.WorkTag.HostHoistable : false) || (react_feature_flags_1.enableHostSingletons ? tag === work_tags_1.WorkTag.HostSingleton : false)) && stateNode !== null) {
            var currentTarget = stateNode;
            if (inCapturePhase) {
                var captureListener = (0, getListener_1.default)(instance, registrationName);
                if (captureListener != null) {
                    listeners.unshift(createDispatchListener(instance, captureListener, currentTarget));
                }
            }
            else if (!inCapturePhase) {
                var bubbleListener = (0, getListener_1.default)(instance, registrationName);
                if (bubbleListener != null) {
                    listeners.push(createDispatchListener(instance, bubbleListener, currentTarget));
                }
            }
        }
        instance = instance.return;
    }
    if (listeners.length !== 0) {
        dispatchQueue.push({
            event: event,
            listeners: listeners
        });
    }
}
// We should only use this function for:
// - EnterLeaveEventPlugin
// This is because we only process this plugin
// in the bubble phase, so we need to accumulate two
// phase event listeners.
function accumulateEnterLeaveTwoPhaseListeners(dispatchQueue, leaveEvent, enterEvent, from, to) {
    var common = from && to ? getLowestCommonAncestor(from, to) : null;
    if (from !== null) {
        accumulateEnterLeaveListenersForEvent(dispatchQueue, leaveEvent, from, common, false);
    }
    if (to !== null && enterEvent !== null) {
        accumulateEnterLeaveListenersForEvent(dispatchQueue, enterEvent, to, common, true);
    }
}
exports.accumulateEnterLeaveTwoPhaseListeners = accumulateEnterLeaveTwoPhaseListeners;
function accumulateEventHandleNonManagedNodeListeners(reactEventType, currentTarget, inCapturePhase) {
    var listeners = [];
    var eventListeners = (0, ReactDOMComponentTree_1.getEventHandlerListeners)(currentTarget);
    if (eventListeners !== null) {
        eventListeners.forEach(function (entry) {
            if (entry.type === reactEventType && entry.capture === inCapturePhase) {
                listeners.push(createDispatchListener(null, entry.callback, currentTarget));
            }
        });
    }
    return listeners;
}
exports.accumulateEventHandleNonManagedNodeListeners = accumulateEventHandleNonManagedNodeListeners;
function accumulateSinglePhaseListeners(targetFiber, reactName, nativeEventType, inCapturePhase, accumulateTargetOnly, nativeEvent) {
    var captureName = reactName !== null ? reactName + "Capture" : null;
    var reactEventName = inCapturePhase ? captureName : reactName;
    var listeners = [];
    var instance = targetFiber;
    var lastHostComponent = null;
    // Accumulate all instances and listeners via the target -> root path.
    while (instance !== null) {
        var stateNode = instance.stateNode, tag = instance.tag;
        // Handle listeners that are on HostComponents (i.e. <div>)
        if ((tag === work_tags_1.WorkTag.HostComponent || (react_feature_flags_1.enableFloat ? tag === work_tags_1.WorkTag.HostHoistable : false) || (react_feature_flags_1.enableHostSingletons ? tag === work_tags_1.WorkTag.HostSingleton : false)) && stateNode !== null) {
            lastHostComponent = stateNode;
            if (!lastHostComponent) {
                throw new Error("Expected to have a lastHostComponent by now. This error is likely caused by a bug in React. Please file an issue.");
            }
            // createEventHandle listeners
            if (react_feature_flags_1.enableCreateEventHandleAPI) {
                var eventHandlerListeners = (0, ReactDOMComponentTree_1.getEventHandlerListeners)(lastHostComponent);
                if (eventHandlerListeners !== null) {
                    eventHandlerListeners.forEach(function (entry) {
                        if (entry.type === nativeEventType && entry.capture === inCapturePhase) {
                            listeners.push(createDispatchListener(instance, entry.callback, lastHostComponent));
                        }
                    });
                }
            }
            // Standard React on* listeners, i.e. onClick or onClickCapture
            if (reactEventName !== null) {
                var listener = (0, getListener_1.default)(instance, reactEventName);
                if (listener != null) {
                    listeners.push(createDispatchListener(instance, listener, lastHostComponent));
                }
            }
        }
        else if (react_feature_flags_1.enableCreateEventHandleAPI && react_feature_flags_1.enableScopeAPI && tag === work_tags_1.WorkTag.ScopeComponent && lastHostComponent !== null && stateNode !== null) {
            // Scopes
            var reactScopeInstance = stateNode;
            var eventHandlerListeners = (0, ReactDOMComponentTree_1.getEventHandlerListeners)(reactScopeInstance);
            if (eventHandlerListeners !== null) {
                eventHandlerListeners.forEach(function (entry) {
                    if (entry.type === nativeEventType && entry.capture === inCapturePhase) {
                        listeners.push(createDispatchListener(instance, entry.callback, lastHostComponent));
                    }
                });
            }
        }
        // If we are only accumulating events for the target, then we don't
        // continue to propagate through the React fiber tree to find other
        // listeners.
        if (accumulateTargetOnly) {
            break;
        }
        // If we are processing the onBeforeBlur event, then we need to take
        // into consideration that part of the React tree might have been hidden
        // or deleted (as we're invoking this event during commit). We can find
        // this out by checking if intercept fiber set on the event matches the
        // current instance fiber. In which case, we should clear all existing
        // listeners.
        if (react_feature_flags_1.enableCreateEventHandleAPI && nativeEvent.type === "beforeblur") {
            // $FlowFixMe[prop-missing] internal field
            // @ts-ignore
            var detachedInterceptFiber = nativeEvent._detachedInterceptFiber;
            if (detachedInterceptFiber !== null && (detachedInterceptFiber === instance || detachedInterceptFiber === instance.alternate)) {
                listeners = [];
            }
        }
        instance = instance.return;
    }
    return listeners;
}
exports.accumulateSinglePhaseListeners = accumulateSinglePhaseListeners;
// We should only use this function for:
// - BeforeInputEventPlugin
// - ChangeEventPlugin
// - SelectEventPlugin
// This is because we only process these plugins
// in the bubble phase, so we need to accumulate two
// phase event listeners (via emulation).
function accumulateTwoPhaseListeners(targetFiber, reactName) {
    var captureName = reactName + "Capture";
    var listeners = [];
    var instance = targetFiber;
    // Accumulate all instances and listeners via the target -> root path.
    while (instance !== null) {
        var stateNode = instance.stateNode, tag = instance.tag;
        // Handle listeners that are on HostComponents (i.e. <div>)
        if ((tag === work_tags_1.WorkTag.HostComponent || (react_feature_flags_1.enableFloat ? tag === work_tags_1.WorkTag.HostHoistable : false) || (react_feature_flags_1.enableHostSingletons ? tag === work_tags_1.WorkTag.HostSingleton : false)) && stateNode !== null) {
            var currentTarget = stateNode;
            var captureListener = (0, getListener_1.default)(instance, captureName);
            if (captureListener != null) {
                listeners.unshift(createDispatchListener(instance, captureListener, currentTarget));
            }
            var bubbleListener = (0, getListener_1.default)(instance, reactName);
            if (bubbleListener != null) {
                listeners.push(createDispatchListener(instance, bubbleListener, currentTarget));
            }
        }
        instance = instance.return;
    }
    return listeners;
}
exports.accumulateTwoPhaseListeners = accumulateTwoPhaseListeners;
