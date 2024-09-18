"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flushSync = void 0;
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var root_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/root-tags");
var react_fiber_work_excution_context_1 = require("@zenflux/react-reconciler/src/react-fiber-work-excution-context");
var react_fiber_work_on_root_shared_1 = require("@zenflux/react-reconciler/src/react-fiber-work-on-root-shared");
var react_fiber_work_passive_effects_1 = require("@zenflux/react-reconciler/src/react-fiber-work-passive-effects");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var ReactCurrentBatchConfig = react_shared_internals_1.default.ReactCurrentBatchConfig;
// Overload the definition to the two valid signatures.
// Warning, this opts-out of checking the function body.
// eslint-disable-next-line no-unused-vars
// declare function flushSync<R>( fn: () => R ): R;
// eslint-disable-next-line no-redeclare
// declare function flushSync( arg0: void ): void;
// eslint-disable-next-line no-redeclare
function flushSync(fn) {
    // In legacy mode, we flush pending passive effects at the beginning of the
    // next event, not at the end of the previous one.
    if ((0, react_fiber_work_passive_effects_1.hasRootWithPendingPassiveEffects)() &&
        (0, react_fiber_work_passive_effects_1.getRootWithPendingPassiveEffectsSafe)().tag === root_tags_1.LegacyRoot &&
        (0, react_fiber_work_excution_context_1.isExecutionContextRenderOrCommitActivate)()) {
        (0, react_fiber_work_passive_effects_1.flushPassiveEffects)();
    }
    var prevExecutionContext = (0, react_fiber_work_excution_context_1.getExecutionContext)();
    (0, react_fiber_work_excution_context_1.activateBatchedExecutionContext)();
    var prevTransition = ReactCurrentBatchConfig.transition;
    var previousPriority = (0, react_event_priorities_1.getCurrentUpdatePriority)();
    try {
        ReactCurrentBatchConfig.transition = null;
        (0, react_event_priorities_1.setCurrentUpdatePriority)(react_event_priorities_1.DiscreteEventPriority);
        if (fn) {
            return fn();
        }
        else {
            return undefined;
        }
    }
    finally {
        (0, react_event_priorities_1.setCurrentUpdatePriority)(previousPriority);
        ReactCurrentBatchConfig.transition = prevTransition;
        (0, react_fiber_work_excution_context_1.setExecutionContext)(prevExecutionContext);
        // Flush the immediate callbacks that were scheduled during this batch.
        // Note that this will happen even if batchedUpdates is higher up
        // the stack.
        if ((0, react_fiber_work_excution_context_1.isExecutionContextRenderOrCommitActivate)()) {
            react_fiber_work_on_root_shared_1.ReactFiberWorkOnRootShared.flushSyncWorkOnAllRoots();
        }
    }
}
exports.flushSync = flushSync;
