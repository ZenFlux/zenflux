"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEvents = exports.registerEvents = void 0;
var react_fiber_tree_reflection_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-reflection");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var EventRegistry_1 = require("@zenflux/react-dom-bindings/src/events/EventRegistry");
var CurrentReplayingEvent_1 = require("@zenflux/react-dom-bindings/src/events/CurrentReplayingEvent");
var SyntheticEvent_1 = require("@zenflux/react-dom-bindings/src/events/SyntheticEvent");
var ReactDOMComponentTree_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree");
var react_dom_plugin_event_system_accumulate_1 = require("@zenflux/react-dom-bindings/src/events/react-dom-plugin-event-system-accumulate");
function registerEvents() {
    (0, EventRegistry_1.registerDirectEvent)("onMouseEnter", ["mouseout", "mouseover"]);
    (0, EventRegistry_1.registerDirectEvent)("onMouseLeave", ["mouseout", "mouseover"]);
    (0, EventRegistry_1.registerDirectEvent)("onPointerEnter", ["pointerout", "pointerover"]);
    (0, EventRegistry_1.registerDirectEvent)("onPointerLeave", ["pointerout", "pointerover"]);
}
exports.registerEvents = registerEvents;
/**
 * For almost every interaction we care about, there will be both a top-level
 * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
 * we do not extract duplicate events. However, moving the mouse into the
 * browser from outside will not fire a `mouseout` event. In this case, we use
 * the `mouseover` top-level event.
 */
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, _eventSystemFlags, _targetContainer) {
    var isOverEvent = domEventName === "mouseover" || domEventName === "pointerover";
    var isOutEvent = domEventName === "mouseout" || domEventName === "pointerout";
    if (isOverEvent && !(0, CurrentReplayingEvent_1.isReplayingEvent)(nativeEvent)) {
        // If this is an over event with a target, we might have already dispatched
        // the event in the out event of the other target. If this is replayed,
        // then it's because we couldn't dispatch against this target previously
        // so we have to do it now instead.
        var related = nativeEvent.relatedTarget || nativeEvent.fromElement;
        if (related) {
            // If the related node is managed by React, we can assume that we have
            // already dispatched the corresponding events during its mouseout.
            if ((0, ReactDOMComponentTree_1.getClosestInstanceFromNode)(related) || (0, ReactDOMComponentTree_1.isContainerMarkedAsRoot)(related)) {
                return;
            }
        }
    }
    if (!isOutEvent && !isOverEvent) {
        // Must not be a mouse or pointer in or out - ignoring.
        return;
    }
    var win;
    // TODO: why is this nullable in the types but we read from it?
    if (nativeEventTarget.window === nativeEventTarget) {
        // `nativeEventTarget` is probably a window object.
        win = nativeEventTarget;
    }
    else {
        // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
        var doc = nativeEventTarget.ownerDocument;
        if (doc) {
            win = doc.defaultView || doc.parentWindow;
        }
        else {
            win = window;
        }
    }
    var from;
    var to;
    if (isOutEvent) {
        // @ts-ignore
        var related = nativeEvent.relatedTarget || nativeEvent.toElement;
        from = targetInst;
        to = related ? (0, ReactDOMComponentTree_1.getClosestInstanceFromNode)(related) : null;
        if (to !== null) {
            var nearestMounted = (0, react_fiber_tree_reflection_1.getNearestMountedFiber)(to);
            var tag = to.tag;
            if (to !== nearestMounted || tag !== work_tags_1.WorkTag.HostComponent &&
                (!react_feature_flags_1.enableHostSingletons ? true : tag !== work_tags_1.WorkTag.HostSingleton) &&
                tag !== work_tags_1.WorkTag.HostText) {
                to = null;
            }
        }
    }
    else {
        // Moving to a node from outside the window.
        from = null;
        to = targetInst;
    }
    if (from === to) {
        // Nothing pertains to our managed components.
        return;
    }
    var SyntheticEventCtor = SyntheticEvent_1.SyntheticMouseEvent;
    var leaveEventType = "onMouseLeave";
    var enterEventType = "onMouseEnter";
    var eventTypePrefix = "mouse";
    if (domEventName === "pointerout" || domEventName === "pointerover") {
        SyntheticEventCtor = SyntheticEvent_1.SyntheticPointerEvent;
        leaveEventType = "onPointerLeave";
        enterEventType = "onPointerEnter";
        eventTypePrefix = "pointer";
    }
    var fromNode = from == null ? win : (0, ReactDOMComponentTree_1.getNodeFromInstance)(from);
    var toNode = to == null ? win : (0, ReactDOMComponentTree_1.getNodeFromInstance)(to);
    var leave = new SyntheticEventCtor(leaveEventType, eventTypePrefix + "leave", from, nativeEvent, nativeEventTarget);
    leave.target = fromNode;
    leave.relatedTarget = toNode;
    var enter = null;
    // We should only process this nativeEvent if we are processing
    // the first ancestor. Next time, we will ignore the event.
    var nativeTargetInst = (0, ReactDOMComponentTree_1.getClosestInstanceFromNode)(nativeEventTarget);
    if (nativeTargetInst === targetInst) {
        var enterEvent = new SyntheticEventCtor(enterEventType, eventTypePrefix + "enter", to, nativeEvent, nativeEventTarget);
        enterEvent.target = toNode;
        enterEvent.relatedTarget = fromNode;
        enter = enterEvent;
    }
    (0, react_dom_plugin_event_system_accumulate_1.accumulateEnterLeaveTwoPhaseListeners)(dispatchQueue, leave, enter, from, to);
}
exports.extractEvents = extractEvents;
