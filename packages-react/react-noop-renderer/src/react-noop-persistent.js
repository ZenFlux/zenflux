"use strict";
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_runWithPriority = exports.getRoot = exports.dumpTree = exports.flushPassiveEffects = exports.flushSync = exports.idleUpdates = exports.discreteUpdates = exports.deferredUpdates = exports.batchedUpdates = exports.flushExpired = exports.expire = exports.stopTrackingHostCounters = exports.startTrackingHostCounters = exports.flushNextYield = exports.findInstance = exports.unmountRootWithID = exports.renderToRootWithID = exports.renderLegacySyncRoot = exports.render = exports.createPortal = exports.resetSuspenseyThingCache = exports.resolveSuspenseyThing = exports.getSuspenseyThingStatus = exports.getPendingChildrenAsJSX = exports.getChildrenAsJSX = exports.createLegacyRoot = exports.createRoot = exports.getOrCreateRootContainer = exports.dangerouslyGetPendingChildren = exports.getPendingChildren = exports.dangerouslyGetChildren = exports.getChildren = exports._Scheduler = void 0;
/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */
var react_reconciler_1 = require("@zenflux/react-reconciler");
var create_react_noop_1 = require("@zenflux/react-noop-renderer/src/create-react-noop");
exports._Scheduler = (_a = await (0, create_react_noop_1.default)(react_reconciler_1.reactReconciler, // reconciler
false), _a._Scheduler), exports.getChildren = _a.getChildren, exports.dangerouslyGetChildren = _a.dangerouslyGetChildren, exports.getPendingChildren = _a.getPendingChildren, exports.dangerouslyGetPendingChildren = _a.dangerouslyGetPendingChildren, exports.getOrCreateRootContainer = _a.getOrCreateRootContainer, exports.createRoot = _a.createRoot, exports.createLegacyRoot = _a.createLegacyRoot, exports.getChildrenAsJSX = _a.getChildrenAsJSX, exports.getPendingChildrenAsJSX = _a.getPendingChildrenAsJSX, exports.getSuspenseyThingStatus = _a.getSuspenseyThingStatus, exports.resolveSuspenseyThing = _a.resolveSuspenseyThing, exports.resetSuspenseyThingCache = _a.resetSuspenseyThingCache, exports.createPortal = _a.createPortal, exports.render = _a.render, exports.renderLegacySyncRoot = _a.renderLegacySyncRoot, exports.renderToRootWithID = _a.renderToRootWithID, exports.unmountRootWithID = _a.unmountRootWithID, exports.findInstance = _a.findInstance, exports.flushNextYield = _a.flushNextYield, exports.startTrackingHostCounters = _a.startTrackingHostCounters, exports.stopTrackingHostCounters = _a.stopTrackingHostCounters, exports.expire = _a.expire, exports.flushExpired = _a.flushExpired, exports.batchedUpdates = _a.batchedUpdates, exports.deferredUpdates = _a.deferredUpdates, exports.discreteUpdates = _a.discreteUpdates, exports.idleUpdates = _a.idleUpdates, 
// flushDiscreteUpdates,
exports.flushSync = _a.flushSync, exports.flushPassiveEffects = _a.flushPassiveEffects, 
// act,
exports.dumpTree = _a.dumpTree, exports.getRoot = _a.getRoot, 
// TODO: Remove this once callers migrate to alternatives.
// This should only be used by React internals.
exports.unstable_runWithPriority = _a.unstable_runWithPriority;
