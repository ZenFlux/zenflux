"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFiberFromLegacyHidden = void 0;
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var offscreen_1 = require("@zenflux/react-shared/src/react-internal-constants/offscreen");
var react_fiber_commit_work_offscreen_instance_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-work-offscreen-instance");
var react_fiber_1 = require("@zenflux/react-reconciler/src/react-fiber");
function createFiberFromLegacyHidden(pendingProps, mode, lanes, key) {
    var fiber = (0, react_fiber_1.createFiber)(work_tags_1.WorkTag.LegacyHiddenComponent, pendingProps, key, mode);
    fiber.elementType = react_symbols_1.REACT_LEGACY_HIDDEN_TYPE;
    fiber.lanes = lanes;
    // Adding a stateNode for legacy hidden because it's currently using
    // the offscreen implementation, which depends on a state node
    var instance = {
        _visibility: offscreen_1.OffscreenVisible,
        _pendingVisibility: offscreen_1.OffscreenVisible,
        _pendingMarkers: null,
        _transitions: null,
        _retryCache: null,
        _current: null,
        detach: function () { return (0, react_fiber_commit_work_offscreen_instance_1.detachOffscreenInstance)(instance); },
        attach: function () { return (0, react_fiber_commit_work_offscreen_instance_1.attachOffscreenInstance)(instance); }
    };
    fiber.stateNode = instance;
    return fiber;
}
exports.createFiberFromLegacyHidden = createFiberFromLegacyHidden;
