"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesFiberContain = exports.isFiberSuspenseAndTimedOut = exports.findCurrentHostFiberWithNoPortals = exports.findCurrentHostFiber = exports.findCurrentFiberUsingSlowPath = exports.isMounted = exports.isFiberMounted = exports.getContainerFromFiber = exports.getSuspenseInstanceFromFiber = exports.getNearestMountedFiber = void 0;
var react_instance_map_1 = require("@zenflux/react-shared/src/react-instance-map");
var react_shared_internals_1 = require("@zenflux/react-shared/src/react-shared-internals");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var fiber_flags_1 = require("@zenflux/react-shared/src/react-internal-constants/fiber-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var ReactCurrentOwner = react_shared_internals_1.default.ReactCurrentOwner;
function getNearestMountedFiber(fiber) {
    var node = fiber;
    var nearestMounted = fiber;
    if (!fiber.alternate) {
        // If there is no alternate, this might be a new tree that isn't inserted
        // yet. If it is, then it will have a pending insertion effect on it.
        var nextNode = node;
        do {
            node = nextNode;
            if ((node.flags & (fiber_flags_1.FiberFlags.Placement | fiber_flags_1.FiberFlags.Hydrating)) !== fiber_flags_1.FiberFlags.NoFlags) {
                // This is an insertion or in-progress hydration. The nearest possible
                // mounted fiber is the parent but we need to continue to figure out
                // if that one is still mounted.
                nearestMounted = node.return;
            }
            // $FlowFixMe[incompatible-type] we bail out when we get a null
            nextNode = node.return;
        } while (nextNode);
    }
    else {
        while (node.return) {
            node = node.return;
        }
    }
    if (node.tag === work_tags_1.WorkTag.HostRoot) {
        // TODO: Check if this was a nested HostRoot when used with
        // renderContainerIntoSubtree.
        return nearestMounted;
    }
    // If we didn't hit the root, that means that we're in an disconnected tree
    // that has been unmounted.
    return null;
}
exports.getNearestMountedFiber = getNearestMountedFiber;
function getSuspenseInstanceFromFiber(fiber) {
    if (fiber.tag === work_tags_1.WorkTag.SuspenseComponent) {
        var suspenseState = fiber.memoizedState;
        if (suspenseState === null) {
            var current = fiber.alternate;
            if (current !== null) {
                suspenseState = current.memoizedState;
            }
        }
        if (suspenseState !== null) {
            return suspenseState.dehydrated;
        }
    }
    return null;
}
exports.getSuspenseInstanceFromFiber = getSuspenseInstanceFromFiber;
function getContainerFromFiber(fiber) {
    return fiber.tag === work_tags_1.WorkTag.HostRoot ? fiber.stateNode.containerInfo : null;
}
exports.getContainerFromFiber = getContainerFromFiber;
function isFiberMounted(fiber) {
    return getNearestMountedFiber(fiber) === fiber;
}
exports.isFiberMounted = isFiberMounted;
function isMounted(component) {
    if (__DEV__) {
        var owner = ReactCurrentOwner.current;
        if (owner !== null && owner.tag === work_tags_1.WorkTag.ClassComponent) {
            var ownerFiber = owner;
            var instance = ownerFiber.stateNode;
            if (!instance._warnedAboutRefsInRender) {
                console.error("%s is accessing isMounted inside its render() function. " + "render() should be a pure function of props and state. It should " + "never access something that requires stale data from the previous " + "render, such as refs. Move this logic to componentDidMount and " + "componentDidUpdate instead.", (0, react_get_component_name_from_fiber_1.default)(ownerFiber) || "A component");
            }
            instance._warnedAboutRefsInRender = true;
        }
    }
    var fiber = (0, react_instance_map_1.get)(component);
    if (!fiber) {
        return false;
    }
    return getNearestMountedFiber(fiber) === fiber;
}
exports.isMounted = isMounted;
function assertIsMounted(fiber) {
    if (getNearestMountedFiber(fiber) !== fiber) {
        throw new Error("Unable to find node on an unmounted component.");
    }
}
function findCurrentFiberUsingSlowPath(fiber) {
    var alternate = fiber.alternate;
    if (!alternate) {
        // If there is no alternate, then we only need to check if it is mounted.
        var nearestMounted = getNearestMountedFiber(fiber);
        if (nearestMounted === null) {
            throw new Error("Unable to find node on an unmounted component.");
        }
        if (nearestMounted !== fiber) {
            return null;
        }
        return fiber;
    }
    // If we have two possible branches, we'll walk backwards up to the root
    // to see what path the root points to. On the way we may hit one of the
    // special cases and we'll deal with them.
    var a = fiber;
    var b = alternate;
    while (true) {
        var parentA = a.return;
        if (parentA === null) {
            // We're at the root.
            break;
        }
        var parentB = parentA.alternate;
        if (parentB === null) {
            // There is no alternate. This is an unusual case. Currently, it only
            // happens when a Suspense component is hidden. An extra fragment fiber
            // is inserted in between the Suspense fiber and its children. Skip
            // over this extra fragment fiber and proceed to the next parent.
            var nextParent = parentA.return;
            if (nextParent !== null) {
                a = b = nextParent;
                continue;
            }
            // If there's no parent, we're at the root.
            break;
        }
        // If both copies of the parent fiber point to the same child, we can
        // assume that the child is current. This happens when we bailout on low
        // priority: the bailed out fiber's child reuses the current child.
        if (parentA.child === parentB.child) {
            var child = parentA.child;
            while (child) {
                if (child === a) {
                    // We've determined that A is the current branch.
                    assertIsMounted(parentA);
                    return fiber;
                }
                if (child === b) {
                    // We've determined that B is the current branch.
                    assertIsMounted(parentA);
                    return alternate;
                }
                child = child.sibling;
            }
            // We should never have an alternate for any mounting node. So the only
            // way this could possibly happen is if this was unmounted, if at all.
            throw new Error("Unable to find node on an unmounted component.");
        }
        if (a.return !== b.return) {
            // The return pointer of A and the return pointer of B point to different
            // fibers. We assume that return pointers never criss-cross, so A must
            // belong to the child set of A.return, and B must belong to the child
            // set of B.return.
            a = parentA;
            b = parentB;
        }
        else {
            // The return pointers point to the same fiber. We'll have to use the
            // default, slow path: scan the child sets of each parent alternate to see
            // which child belongs to which set.
            //
            // Search parent A's child set
            var didFindChild = false;
            var child = parentA.child;
            while (child) {
                if (child === a) {
                    didFindChild = true;
                    a = parentA;
                    b = parentB;
                    break;
                }
                if (child === b) {
                    didFindChild = true;
                    b = parentA;
                    a = parentB;
                    break;
                }
                child = child.sibling;
            }
            if (!didFindChild) {
                // Search parent B's child set
                child = parentB.child;
                while (child) {
                    if (child === a) {
                        didFindChild = true;
                        a = parentB;
                        b = parentA;
                        break;
                    }
                    if (child === b) {
                        didFindChild = true;
                        b = parentB;
                        a = parentA;
                        break;
                    }
                    child = child.sibling;
                }
                if (!didFindChild) {
                    throw new Error("Child was not found in either parent set. This indicates a bug " + "in React related to the return pointer. Please file an issue.");
                }
            }
        }
        if (a.alternate !== b) {
            throw new Error("Return fibers should always be each others' alternates. " + "This error is likely caused by a bug in React. Please file an issue.");
        }
    }
    // If the root is not a host container, we're in a disconnected tree. I.e.
    // unmounted.
    if (a.tag !== work_tags_1.WorkTag.HostRoot) {
        throw new Error("Unable to find node on an unmounted component.");
    }
    if (a.stateNode.current === a) {
        // We've determined that A is the current branch.
        return fiber;
    }
    // Otherwise B has to be current branch.
    return alternate;
}
exports.findCurrentFiberUsingSlowPath = findCurrentFiberUsingSlowPath;
function findCurrentHostFiber(parent) {
    var currentParent = findCurrentFiberUsingSlowPath(parent);
    return currentParent !== null ? findCurrentHostFiberImpl(currentParent) : null;
}
exports.findCurrentHostFiber = findCurrentHostFiber;
function findCurrentHostFiberImpl(node) {
    // Next we'll drill down this component to find the first HostComponent/Text.
    var tag = node.tag;
    if (tag === work_tags_1.WorkTag.HostComponent ||
        (react_feature_flags_1.enableFloat ? tag === work_tags_1.WorkTag.HostHoistable : false) ||
        (react_feature_flags_1.enableHostSingletons ? tag === work_tags_1.WorkTag.HostSingleton : false) ||
        tag === work_tags_1.WorkTag.HostText) {
        return node;
    }
    var child = node.child;
    while (child !== null) {
        var match = findCurrentHostFiberImpl(child);
        if (match !== null) {
            return match;
        }
        child = child.sibling;
    }
    return null;
}
function findCurrentHostFiberWithNoPortals(parent) {
    var currentParent = findCurrentFiberUsingSlowPath(parent);
    return currentParent !== null ? findCurrentHostFiberWithNoPortalsImpl(currentParent) : null;
}
exports.findCurrentHostFiberWithNoPortals = findCurrentHostFiberWithNoPortals;
function findCurrentHostFiberWithNoPortalsImpl(node) {
    // Next we'll drill down this component to find the first HostComponent/Text.
    var tag = node.tag;
    if (tag === work_tags_1.WorkTag.HostComponent || (react_feature_flags_1.enableFloat ? tag === work_tags_1.WorkTag.HostHoistable : false) || (react_feature_flags_1.enableHostSingletons ? tag === work_tags_1.WorkTag.HostSingleton : false) || tag === work_tags_1.WorkTag.HostText) {
        return node;
    }
    var child = node.child;
    while (child !== null) {
        if (child.tag !== work_tags_1.WorkTag.HostPortal) {
            var match = findCurrentHostFiberWithNoPortalsImpl(child);
            if (match !== null) {
                return match;
            }
        }
        child = child.sibling;
    }
    return null;
}
function isFiberSuspenseAndTimedOut(fiber) {
    var memoizedState = fiber.memoizedState;
    return fiber.tag === work_tags_1.WorkTag.SuspenseComponent && memoizedState !== null && memoizedState.dehydrated === null;
}
exports.isFiberSuspenseAndTimedOut = isFiberSuspenseAndTimedOut;
function doesFiberContain(parentFiber, childFiber) {
    var node = childFiber;
    var parentFiberAlternate = parentFiber.alternate;
    while (node !== null) {
        if (node === parentFiber || node === parentFiberAlternate) {
            return true;
        }
        node = node.return;
    }
    return false;
}
exports.doesFiberContain = doesFiberContain;
