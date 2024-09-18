"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryHydrateSuspense = exports.tryHydrateText = exports.tryHydrateInstance = void 0;
var fiber_lane_constants_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants");
var react_fiber_tree_context_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-context");
var react_fiber_1 = require("@zenflux/react-reconciler/src/react-fiber");
var react_fiber_hydration_context_parent_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-parent");
var react_fiber_hydration_context_next_instance_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-next-instance");
var react_fiber_hydration_context_root_or_singleton_1 = require("@zenflux/react-reconciler/src/react-fiber-hydration-context-root-or-singleton");
var _a = globalThis.__RECONCILER__CONFIG__, canHydrateInstance = _a.canHydrateInstance, canHydrateSuspenseInstance = _a.canHydrateSuspenseInstance, canHydrateTextInstance = _a.canHydrateTextInstance, getFirstHydratableChild = _a.getFirstHydratableChild;
function tryHydrateInstance(fiber, nextInstance) {
    // fiber is a HostComponent Fiber
    var instance = canHydrateInstance(nextInstance, fiber.type, fiber.pendingProps, (0, react_fiber_hydration_context_root_or_singleton_1.hasRootOrSingletonContextFlag)());
    if (instance !== null) {
        fiber.stateNode = instance;
        (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
        (0, react_fiber_hydration_context_next_instance_1.setNextHydratableInstance)(getFirstHydratableChild(instance));
        (0, react_fiber_hydration_context_root_or_singleton_1.clearRootOrSingletonContextFlag)();
        return true;
    }
    return false;
}
exports.tryHydrateInstance = tryHydrateInstance;
function tryHydrateText(fiber, nextInstance) {
    // fiber is a HostText Fiber
    var text = fiber.pendingProps;
    var textInstance = canHydrateTextInstance(nextInstance, text, (0, react_fiber_hydration_context_root_or_singleton_1.hasRootOrSingletonContextFlag)());
    if (textInstance !== null) {
        fiber.stateNode = textInstance;
        (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
        // Text Instances don't have children so there's nothing to hydrate.
        (0, react_fiber_hydration_context_next_instance_1.clearNextHydratableInstance)();
        return true;
    }
    return false;
}
exports.tryHydrateText = tryHydrateText;
function tryHydrateSuspense(fiber, nextInstance) {
    // fiber is a SuspenseComponent Fiber
    var suspenseInstance = canHydrateSuspenseInstance(nextInstance, (0, react_fiber_hydration_context_root_or_singleton_1.hasRootOrSingletonContextFlag)());
    if (suspenseInstance !== null) {
        fiber.memoizedState = {
            dehydrated: suspenseInstance,
            treeContext: (0, react_fiber_tree_context_1.getSuspendedTreeContext)(),
            retryLane: fiber_lane_constants_1.OffscreenLane
        };
        // Store the dehydrated fragment as a child fiber.
        // This simplifies the code for getHostSibling and deleting nodes,
        // since it doesn't have to consider all Suspense boundaries and
        // check if they're dehydrated ones or not.
        var dehydratedFragment = (0, react_fiber_1.createFiberFromDehydratedFragment)(suspenseInstance);
        dehydratedFragment.return = fiber;
        fiber.child = dehydratedFragment;
        (0, react_fiber_hydration_context_parent_1.setHydrationParentFiber)(fiber);
        // While a Suspense Instance does have children, we won't step into
        // it during the first pass. Instead, we'll reenter it later.
        (0, react_fiber_hydration_context_next_instance_1.clearNextHydratableInstance)();
        return true;
    }
    return false;
}
exports.tryHydrateSuspense = tryHydrateSuspense;
