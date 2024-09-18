"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryIfBlockedOn = exports.queueExplicitHydrationTarget = exports.queueIfContinuousEvent = exports.clearIfContinuousEvent = exports.isDiscreteEventThatRequiresHydration = void 0;
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var react_scheduler_1 = require("@zenflux/react-scheduler");
var react_fiber_tree_reflection_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-reflection");
var react_fiber_shell_hydration_1 = require("@zenflux/react-reconciler/src/react-fiber-shell-hydration");
var react_fiber_reconciler_1 = require("@zenflux/react-reconciler/src/react-fiber-reconciler");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_dom_event_listener_find_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-event-listener-find");
var FormActionEventPlugin_1 = require("@zenflux/react-dom-bindings/src/events/plugins/FormActionEventPlugin");
var CurrentReplayingEvent_1 = require("@zenflux/react-dom-bindings/src/events/CurrentReplayingEvent");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
var hasScheduledReplayAttempt = false;
// The last of each continuous event type. We only need to replay the last one
// if the last target was dehydrated.
var queuedFocus = null;
var queuedDrag = null;
var queuedMouse = null;
// For pointer events there can be one latest event per pointerId.
var queuedPointers = new Map();
var queuedPointerCaptures = new Map();
var queuedExplicitHydrationTargets = [];
var discreteReplayableEvents = ["mousedown", "mouseup", "touchcancel", "touchend", "touchstart", "auxclick", "dblclick", "pointercancel", "pointerdown", "pointerup", "dragend", "dragstart", "drop", "compositionend", "compositionstart", "keydown", "keypress", "keyup", "input", "textInput",
    "copy", "cut", "paste", "click", "change", "contextmenu", "reset" // 'submit', // stopPropagation blocks the replay mechanism
];
function isDiscreteEventThatRequiresHydration(eventType) {
    return discreteReplayableEvents.indexOf(eventType) > -1;
}
exports.isDiscreteEventThatRequiresHydration = isDiscreteEventThatRequiresHydration;
function createQueuedReplayableEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
    return {
        blockedOn: blockedOn,
        domEventName: domEventName,
        eventSystemFlags: eventSystemFlags,
        nativeEvent: nativeEvent,
        targetContainers: [targetContainer]
    };
}
// Resets the replaying for this type of continuous event to no event.
function clearIfContinuousEvent(domEventName, nativeEvent) {
    switch (domEventName) {
        case "focusin":
        case "focusout":
            queuedFocus = null;
            break;
        case "dragenter":
        case "dragleave":
            queuedDrag = null;
            break;
        case "mouseover":
        case "mouseout":
            queuedMouse = null;
            break;
        case "pointerover":
        case "pointerout": {
            var pointerId = nativeEvent.pointerId;
            queuedPointers.delete(pointerId);
            break;
        }
        case "gotpointercapture":
        case "lostpointercapture": {
            var pointerId = nativeEvent.pointerId;
            queuedPointerCaptures.delete(pointerId);
            break;
        }
    }
}
exports.clearIfContinuousEvent = clearIfContinuousEvent;
function accumulateOrCreateContinuousQueuedReplayableEvent(existingQueuedEvent, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
    if (existingQueuedEvent === null || existingQueuedEvent.nativeEvent !== nativeEvent) {
        var queuedEvent = createQueuedReplayableEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent);
        if (blockedOn !== null) {
            var fiber = (0, ReactDOMComponentTree_1.getInstanceFromNode)(blockedOn);
            if (fiber !== null) {
                // Attempt to increase the priority of this target.
                (0, react_fiber_reconciler_1.attemptContinuousHydration)(fiber);
            }
        }
        return queuedEvent;
    }
    // If we have already queued this exact event, then it's because
    // the different event systems have different DOM event listeners.
    // We can accumulate the flags, and the targetContainers, and
    // store a single event to be replayed.
    existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
    var targetContainers = existingQueuedEvent.targetContainers;
    if (targetContainer !== null && targetContainers.indexOf(targetContainer) === -1) {
        targetContainers.push(targetContainer);
    }
    return existingQueuedEvent;
}
function queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
    // These set relatedTarget to null because the replayed event will be treated as if we
    // moved from outside the window (no target) onto the target once it hydrates.
    // Instead of mutating we could clone the event.
    switch (domEventName) {
        case "focusin": {
            var focusEvent = nativeEvent;
            queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(queuedFocus, blockedOn, domEventName, eventSystemFlags, targetContainer, focusEvent);
            return true;
        }
        case "dragenter": {
            var dragEvent = nativeEvent;
            queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(queuedDrag, blockedOn, domEventName, eventSystemFlags, targetContainer, dragEvent);
            return true;
        }
        case "mouseover": {
            var mouseEvent = nativeEvent;
            queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(queuedMouse, blockedOn, domEventName, eventSystemFlags, targetContainer, mouseEvent);
            return true;
        }
        case "pointerover": {
            var pointerEvent = nativeEvent;
            var pointerId = pointerEvent.pointerId;
            queuedPointers.set(pointerId, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointers.get(pointerId) || null, blockedOn, domEventName, eventSystemFlags, targetContainer, pointerEvent));
            return true;
        }
        case "gotpointercapture": {
            var pointerEvent = nativeEvent;
            var pointerId = pointerEvent.pointerId;
            queuedPointerCaptures.set(pointerId, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointerCaptures.get(pointerId) || null, blockedOn, domEventName, eventSystemFlags, targetContainer, pointerEvent));
            return true;
        }
    }
    return false;
}
exports.queueIfContinuousEvent = queueIfContinuousEvent;
// Check if this target is unblocked. Returns true if it's unblocked.
function attemptExplicitHydrationTarget(queuedTarget) {
    // TODO: This function shares a lot of logic with findInstanceBlockingEvent.
    // Try to unify them. It's a bit tricky since it would require two return
    // values.
    var targetInst = (0, ReactDOMComponentTree_1.getClosestInstanceFromNode)(queuedTarget.target);
    if (targetInst !== null) {
        var nearestMounted_1 = (0, react_fiber_tree_reflection_1.getNearestMountedFiber)(targetInst);
        if (nearestMounted_1 !== null) {
            var tag = nearestMounted_1.tag;
            if (tag === work_tags_1.WorkTag.SuspenseComponent) {
                var instance = (0, react_fiber_tree_reflection_1.getSuspenseInstanceFromFiber)(nearestMounted_1);
                if (instance !== null) {
                    // We're blocked on hydrating this boundary.
                    // Increase its priority.
                    queuedTarget.blockedOn = instance;
                    (0, react_event_priorities_1.runWithPriority)(queuedTarget.priority, function () {
                        (0, react_fiber_reconciler_1.attemptHydrationAtCurrentPriority)(nearestMounted_1);
                    });
                    return;
                }
            }
            else if (tag === work_tags_1.WorkTag.HostRoot) {
                var root = nearestMounted_1.stateNode;
                if ((0, react_fiber_shell_hydration_1.isRootDehydrated)(root)) {
                    queuedTarget.blockedOn = (0, react_fiber_tree_reflection_1.getContainerFromFiber)(nearestMounted_1);
                    // We don't currently have a way to increase the priority of
                    // a root other than sync.
                    return;
                }
            }
        }
    }
    queuedTarget.blockedOn = null;
}
function queueExplicitHydrationTarget(target) {
    // TODO: This will read the priority if it's dispatched by the React
    // event system but not native events. Should read window.event.type, like
    // we do for updates (getCurrentEventPriority).
    var updatePriority = (0, react_event_priorities_1.getCurrentUpdatePriority)();
    var queuedTarget = {
        blockedOn: null,
        target: target,
        priority: updatePriority
    };
    var i = 0;
    for (; i < queuedExplicitHydrationTargets.length; i++) {
        // Stop once we hit the first target with lower priority than
        if (!(0, react_event_priorities_1.isHigherEventPriority)(updatePriority, queuedExplicitHydrationTargets[i].priority)) {
            break;
        }
    }
    queuedExplicitHydrationTargets.splice(i, 0, queuedTarget);
    if (i === 0) {
        attemptExplicitHydrationTarget(queuedTarget);
    }
}
exports.queueExplicitHydrationTarget = queueExplicitHydrationTarget;
function attemptReplayContinuousQueuedEvent(queuedEvent) {
    if (queuedEvent.blockedOn !== null) {
        return false;
    }
    var targetContainers = queuedEvent.targetContainers;
    while (targetContainers.length > 0) {
        var nextBlockedOn = (0, react_dom_event_listener_find_1.findInstanceBlockingEvent)(queuedEvent.nativeEvent);
        if (nextBlockedOn === null) {
            var nativeEvent = queuedEvent.nativeEvent;
            // @ts-ignore - Can it be just new?
            var nativeEventClone = new nativeEvent.constructor(nativeEvent.type, nativeEvent);
            (0, CurrentReplayingEvent_1.setReplayingEvent)(nativeEventClone);
            // @ts-ignore
            nativeEvent.target.dispatchEvent(nativeEventClone);
            (0, CurrentReplayingEvent_1.resetReplayingEvent)();
        }
        else {
            // We're still blocked. Try again later.
            var fiber = (0, ReactDOMComponentTree_1.getInstanceFromNode)(nextBlockedOn);
            if (fiber !== null) {
                (0, react_fiber_reconciler_1.attemptContinuousHydration)(fiber);
            }
            queuedEvent.blockedOn = nextBlockedOn;
            return false;
        }
        // This target container was successfully dispatched. Try the next.
        targetContainers.shift();
    }
    return true;
}
function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
    if (attemptReplayContinuousQueuedEvent(queuedEvent)) {
        map.delete(key);
    }
}
function replayUnblockedEvents() {
    hasScheduledReplayAttempt = false;
    // Replay any continuous events.
    if (queuedFocus !== null && attemptReplayContinuousQueuedEvent(queuedFocus)) {
        queuedFocus = null;
    }
    if (queuedDrag !== null && attemptReplayContinuousQueuedEvent(queuedDrag)) {
        queuedDrag = null;
    }
    if (queuedMouse !== null && attemptReplayContinuousQueuedEvent(queuedMouse)) {
        queuedMouse = null;
    }
    queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap);
    queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
}
function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
    if (queuedEvent.blockedOn === unblocked) {
        queuedEvent.blockedOn = null;
        if (!hasScheduledReplayAttempt) {
            hasScheduledReplayAttempt = true;
            // Schedule a callback to attempt replaying as many events as are
            // now unblocked. This first might not actually be unblocked yet.
            // We could check it early to avoid scheduling an unnecessary callback.
            (0, react_scheduler_1.unstable_scheduleCallback)(react_scheduler_1.unstable_NormalPriority, replayUnblockedEvents);
        }
    }
}
var lastScheduledReplayQueue = null;
function replayUnblockedFormActions(formReplayingQueue) {
    if (lastScheduledReplayQueue === formReplayingQueue) {
        lastScheduledReplayQueue = null;
    }
    for (var i = 0; i < formReplayingQueue.length; i += 3) {
        var form = formReplayingQueue[i];
        var submitterOrAction = formReplayingQueue[i + 1];
        var formData = formReplayingQueue[i + 2];
        if (typeof submitterOrAction !== "function") {
            // This action is not hydrated yet. This might be because it's blocked on
            // a different React instance or higher up our tree.
            var blockedOn = (0, react_dom_event_listener_find_1.findInstanceBlockingTarget)(submitterOrAction || form);
            if (blockedOn === null) {
                // We're not blocked but we don't have an action. This must mean that
                // this is in another React instance. We'll just skip past it.
                continue;
            }
            else {
                // We're blocked on something in this React instance. We'll retry later.
                break;
            }
        }
        var formInst = (0, ReactDOMComponentTree_1.getInstanceFromNode)(form);
        if (formInst !== null) {
            // This is part of our instance.
            // We're ready to replay this. Let's delete it from the queue.
            formReplayingQueue.splice(i, 3);
            i -= 3;
            (0, FormActionEventPlugin_1.dispatchReplayedFormAction)(formInst, form, submitterOrAction, formData);
            // Continue without incrementing the index.
        } // This form must've been part of a different React instance.
        // If we want to preserve ordering between React instances on the same root
        // we'd need some way for the other instance to ping us when it's done.
        // We'll just skip this and let the other instance execute it.
    }
}
function scheduleReplayQueueIfNeeded(formReplayingQueue) {
    // Schedule a callback to execute any unblocked form actions in.
    // We only keep track of the last queue which means that if multiple React oscillate
    // commits, we could schedule more callbacks than necessary but it's not a big deal
    // and we only really except one instance.
    if (lastScheduledReplayQueue !== formReplayingQueue) {
        lastScheduledReplayQueue = formReplayingQueue;
        (0, react_scheduler_1.unstable_scheduleCallback)(react_scheduler_1.unstable_NormalPriority, function () { return replayUnblockedFormActions(formReplayingQueue); });
    }
}
function retryIfBlockedOn(unblocked) {
    if (queuedFocus !== null) {
        scheduleCallbackIfUnblocked(queuedFocus, unblocked);
    }
    if (queuedDrag !== null) {
        scheduleCallbackIfUnblocked(queuedDrag, unblocked);
    }
    if (queuedMouse !== null) {
        scheduleCallbackIfUnblocked(queuedMouse, unblocked);
    }
    var unblock = function (queuedEvent) { return scheduleCallbackIfUnblocked(queuedEvent, unblocked); };
    queuedPointers.forEach(unblock);
    queuedPointerCaptures.forEach(unblock);
    for (var i = 0; i < queuedExplicitHydrationTargets.length; i++) {
        var queuedTarget = queuedExplicitHydrationTargets[i];
        if (queuedTarget.blockedOn === unblocked) {
            queuedTarget.blockedOn = null;
        }
    }
    while (queuedExplicitHydrationTargets.length > 0) {
        var nextExplicitTarget = queuedExplicitHydrationTargets[0];
        if (nextExplicitTarget.blockedOn !== null) {
            // We're still blocked.
            break;
        }
        else {
            attemptExplicitHydrationTarget(nextExplicitTarget);
            if (nextExplicitTarget.blockedOn === null) {
                // We're unblocked.
                queuedExplicitHydrationTargets.shift();
            }
        }
    }
    if (react_feature_flags_1.enableFormActions) {
        // Check the document if there are any queued form actions.
        var root = unblocked.getRootNode();
        var formReplayingQueue = root.$$reactFormReplay;
        if (formReplayingQueue != null) {
            for (var i = 0; i < formReplayingQueue.length; i += 3) {
                var form = formReplayingQueue[i];
                var submitterOrAction = formReplayingQueue[i + 1];
                var formProps = (0, ReactDOMComponentTree_1.getFiberCurrentPropsFromNode)(form);
                if (typeof submitterOrAction === "function") {
                    // This action has already resolved. We're just waiting to dispatch it.
                    if (!formProps) {
                        // This was not part of this React instance. It might have been recently
                        // unblocking us from dispatching our events. So let's make sure we schedule
                        // a retry.
                        scheduleReplayQueueIfNeeded(formReplayingQueue);
                    }
                    continue;
                }
                var target = form;
                if (formProps) {
                    // This form belongs to this React instance but the submitter might
                    // not be done yet.
                    var action = null;
                    var submitter = submitterOrAction;
                    if (submitter && submitter.hasAttribute("formAction")) {
                        // The submitter is the one that is responsible for the action.
                        target = submitter;
                        var submitterProps = (0, ReactDOMComponentTree_1.getFiberCurrentPropsFromNode)(submitter);
                        if (submitterProps) {
                            // The submitter is part of this instance.
                            action = submitterProps.formAction;
                        }
                        else {
                            var blockedOn = (0, react_dom_event_listener_find_1.findInstanceBlockingTarget)(target);
                            if (blockedOn !== null) {
                                // The submitter is not hydrated yet. We'll wait for it.
                                continue;
                            } // The submitter must have been a part of a different React instance.
                            // Except the form isn't. We don't dispatch actions in this scenario.
                        }
                    }
                    else {
                        action = formProps.action;
                    }
                    if (typeof action === "function") {
                        formReplayingQueue[i + 1] = action;
                    }
                    else {
                        // Something went wrong so let's just delete this action.
                        formReplayingQueue.splice(i, 3);
                        i -= 3;
                    }
                    // Schedule a replay in case this unblocked something.
                    scheduleReplayQueueIfNeeded(formReplayingQueue);
                } // Something above this target is still blocked so we can't continue yet.
                // We're not sure if this target is actually part of this React instance
                // yet. It could be a different React as a child but at least some parent is.
                // We must continue for any further queued actions.
            }
        }
    }
}
exports.retryIfBlockedOn = retryIfBlockedOn;
