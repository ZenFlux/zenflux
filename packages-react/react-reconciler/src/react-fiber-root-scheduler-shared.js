"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactFiberRootSchedulerShared = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
// A linked list of all the roots with pending work. In an idiomatic app,
// there's only a single root, but we do support multi root apps, hence this
// extra complexity. But this module is optimized for the single root case.
var firstScheduledRoot = null;
var lastScheduledRoot = null;
// Used to prevent redundant mircotasks from being scheduled.
var didScheduleMicrotask = false;
// `act` "microtasks" are scheduled on the `act` queue instead of an actual
// microtask, so we have to dedupe those separately. This wouldn't be an issue
// if we required all `act` calls to be awaited, which we might in the future.
var didScheduleMicrotask_act = false;
var currentEventTransitionLane = fiber_lane_constants_1.NoLane;
var ReactFiberRootSchedulerShared = /** @class */ (function () {
    function ReactFiberRootSchedulerShared() {
    }
    ReactFiberRootSchedulerShared.firstScheduledRoot = firstScheduledRoot;
    ReactFiberRootSchedulerShared.lastScheduledRoot = lastScheduledRoot;
    ReactFiberRootSchedulerShared.didScheduleMicrotask = didScheduleMicrotask;
    ReactFiberRootSchedulerShared.didScheduleMicrotask_act = didScheduleMicrotask_act;
    ReactFiberRootSchedulerShared.currentEventTransitionLane = currentEventTransitionLane;
    return ReactFiberRootSchedulerShared;
}());
exports.ReactFiberRootSchedulerShared = ReactFiberRootSchedulerShared;
