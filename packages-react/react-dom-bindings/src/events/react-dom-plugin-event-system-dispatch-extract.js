"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractEvents = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var EventSystemFlags_1 = require("@zenflux/react-dom-bindings/src/events/EventSystemFlags");
var SimpleEventPlugin = require("@zenflux/react-dom-bindings/src/events/plugins/SimpleEventPlugin");
var EnterLeaveEventPlugin = require("@zenflux/react-dom-bindings/src/events/plugins/EnterLeaveEventPlugin");
var ChangeEventPlugin = require("@zenflux/react-dom-bindings/src/events/plugins/ChangeEventPlugin");
var SelectEventPlugin = require("@zenflux/react-dom-bindings/src/events/plugins/SelectEventPlugin");
var BeforeInputEventPlugin = require("@zenflux/react-dom-bindings/src/events/plugins/BeforeInputEventPlugin");
var FormActionEventPlugin = require("@zenflux/react-dom-bindings/src/events/plugins/FormActionEventPlugin");
function extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    // TODO: we should remove the concept of a "SimpleEventPlugin".
    // This is the basic functionality of the event system. All
    // the other plugins are essentially polyfills. So the plugin
    // should probably be inlined somewhere and have its logic
    // be core the to event system. This would potentially allow
    // us to ship builds of React without the polyfilled plugins below.
    SimpleEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
    var shouldProcessPolyfillPlugins = (eventSystemFlags & EventSystemFlags_1.SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS) === 0;
    // We don't process these events unless we are in the
    // event's native "bubble" phase, which means that we're
    // not in the capture phase. That's because we emulate
    // the capture phase here still. This is a trade-off,
    // because in an ideal world we would not emulate and use
    // the phases properly, like we do with the SimpleEvent
    // plugin. However, the plugins below either expect
    // emulation (EnterLeave) or use state localized to that
    // plugin (BeforeInput, Change, Select). The state in
    // these modules complicates things, as you'll essentially
    // get the case where the capture phase event might change
    // state, only for the following bubble event to come in
    // later and not trigger anything as the state now
    // invalidates the heuristics of the event plugin. We
    // could alter all these plugins to work in such ways, but
    // that might cause other unknown side-effects that we
    // can't foresee right now.
    if (shouldProcessPolyfillPlugins) {
        EnterLeaveEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
        ChangeEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
        SelectEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
        BeforeInputEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
        if (react_feature_flags_1.enableFormActions) {
            FormActionEventPlugin.extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer);
        }
    }
}
exports.extractEvents = extractEvents;
