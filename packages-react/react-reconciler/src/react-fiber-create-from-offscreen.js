"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFiberFromOffscreen = void 0;
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var offscreen_1 = require("@zenflux/react-shared/src/react-internal-constants/offscreen");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_fiber_commit_work_offscreen_instance_1 = require("@zenflux/react-reconciler/src/react-fiber-commit-work-offscreen-instance");
var react_fiber_1 = require("@zenflux/react-reconciler/src/react-fiber");
function createFiberFromOffscreen(pendingProps, mode, lanes, key) {
    var fiber = (0, react_fiber_1.createFiber)(work_tags_1.WorkTag.OffscreenComponent, pendingProps, key, mode);
    fiber.elementType = react_symbols_1.REACT_OFFSCREEN_TYPE;
    fiber.lanes = lanes;
    var primaryChildInstance = {
        _visibility: offscreen_1.OffscreenVisible,
        _pendingVisibility: offscreen_1.OffscreenVisible,
        _pendingMarkers: null,
        _retryCache: null,
        _transitions: null,
        _current: null,
        detach: function () { return (0, react_fiber_commit_work_offscreen_instance_1.detachOffscreenInstance)(primaryChildInstance); },
        attach: function () { return (0, react_fiber_commit_work_offscreen_instance_1.attachOffscreenInstance)(primaryChildInstance); }
    };
    fiber.stateNode = primaryChildInstance;
    return fiber;
}
exports.createFiberFromOffscreen = createFiberFromOffscreen;
