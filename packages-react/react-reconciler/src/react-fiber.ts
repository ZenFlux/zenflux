import {
    allowConcurrentByDefault,
    createRootStrictEffectsByDefault,
    enableProfilerTimer,
    forceConcurrentByDefaultForTesting
} from "@zenflux/react-shared/src/react-feature-flags";

import {
    REACT_CACHE_TYPE,
    REACT_SUSPENSE_LIST_TYPE,
    REACT_SUSPENSE_TYPE,
    REACT_TRACING_MARKER_TYPE
} from "@zenflux/react-shared/src/react-symbols";

import { ConcurrentRoot } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";
import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";
import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { TracingMarkerTag } from "@zenflux/react-shared/src/react-internal-constants/transition";

import { NoLanes } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { isDevToolsPresent } from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";

import type { SuspenseInstance } from "@zenflux/react-shared/src/react-internal-types/suspense";

import type { TracingMarkerInstance } from "@zenflux/react-shared/src/react-internal-types/tracing";

import type { Lanes } from "@zenflux/react-shared/src/react-internal-types";

import type { Fiber } from "@zenflux/react-reconciler/src/react-fiber-config";
import type { ReactFragment, ReactPortal } from "@zenflux/react-shared/src/react-types";
import type { RootTag } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

let hasBadMapPolyfill: boolean;

if ( __DEV__ ) {
    hasBadMapPolyfill = false;

    try {
        const nonExtensibleObject = Object.preventExtensions( {} );

        /* eslint-disable no-new */
        new Map( [ [ nonExtensibleObject, null ] ] );
        new Set( [ nonExtensibleObject ] );
        /* eslint-enable no-new */
    } catch ( e ) {
        // TODO: Consider warning about bad polyfills
        hasBadMapPolyfill = true;
    }
}

export function FiberNode( this: any, tag: WorkTag, pendingProps: unknown, key: null | string, mode: TypeOfMode ) {
    // Instance
    this.tag = tag;
    this.key = key;
    this.elementType = null;
    this.type = null;
    this.stateNode = null;
    // Fiber
    this.return = null;
    this.child = null;
    this.sibling = null;
    this.index = 0;
    this.ref = null;
    this.refCleanup = null;
    this.pendingProps = pendingProps;
    this.memoizedProps = null;
    this.updateQueue = null;
    this.memoizedState = null;
    this.dependencies = null;
    this.mode = mode;
    // Effects
    this.flags = FiberFlags.NoFlags;
    this.subtreeFlags = FiberFlags.NoFlags;
    this.deletions = null;
    this.lanes = NoLanes;
    this.childLanes = NoLanes;
    this.alternate = null;

    if ( enableProfilerTimer ) {
        // Note: The following is done to avoid a v8 performance cliff.
        //
        // Initializing the fields below to smis and later updating them with
        // double values will cause Fibers to end up having separate shapes.
        // This behavior/bug has something to do with Object.preventExtension().
        // Fortunately this only impacts DEV builds.
        // Unfortunately it makes React unusably slow for some applications.
        // To work around this, initialize the fields below with doubles.
        //
        // Learn more about this here:
        // https://github.com/facebook/react/issues/14365
        // https://bugs.chromium.org/p/v8/issues/detail?id=8538
        this.actualDuration = Number.NaN;
        this.actualStartTime = Number.NaN;
        this.selfBaseDuration = Number.NaN;
        this.treeBaseDuration = Number.NaN;
        // It's okay to replace the initial doubles with smis after initialization.
        // This won't trigger the performance cliff mentioned above,
        // and it simplifies other profiler code (including DevTools).
        this.actualDuration = 0;
        this.actualStartTime = -1;
        this.selfBaseDuration = 0;
        this.treeBaseDuration = 0;
    }

    if ( __DEV__ ) {
        // This isn't directly used but is handy for debugging internals:
        this._debugSource = null;
        this._debugOwner = null;
        this._debugNeedsRemount = false;
        this._debugHookTypes = null;

        if ( ! hasBadMapPolyfill && typeof Object.preventExtensions === "function" ) {
            Object.preventExtensions( this );
        }
    }
}

// This is a constructor function, rather than a POJO constructor, still
// please ensure we do the following:
// 1) Nobody should add any instance methods on this. Instance methods can be
//    more difficult to predict when they get optimized and they are almost
//    never inlined properly in static compilers.
// 2) Nobody should rely on `instanceof Fiber` for type testing. We should
//    always know when it is a fiber.
// 3) We might want to experiment with using numeric keys since they are easier
//    to optimize in a non-JIT environment.
// 4) We can easily go from a constructor to a createFiber object literal if that
//    is faster.
// 5) It should be easy to port this to a C struct and keep a C implementation
//    compatible.
export function createFiber( tag: WorkTag, pendingProps: unknown, key: null | string, mode: TypeOfMode ): Fiber {
    // $FlowFixMe[invalid-constructor]: the shapes are exact here but Flow doesn't like constructors
    // @ts-ignore
    return new FiberNode( tag, pendingProps, key, mode );
}

export function createHostRootFiber( tag: RootTag, isStrictMode: boolean, concurrentUpdatesByDefaultOverride: null | boolean ): Fiber {
    let mode;

    if ( tag === ConcurrentRoot ) {
        mode = TypeOfMode.ConcurrentMode;

        if ( isStrictMode === true || createRootStrictEffectsByDefault ) {
            mode |= TypeOfMode.StrictLegacyMode | TypeOfMode.StrictEffectsMode;
        }

        if ( // We only use this flag for our repo tests to check both behaviors.
            forceConcurrentByDefaultForTesting ) {
            mode |= TypeOfMode.ConcurrentUpdatesByDefaultMode;
        } else if ( // Only for internal experiments.
            allowConcurrentByDefault && concurrentUpdatesByDefaultOverride ) {
            mode |= TypeOfMode.ConcurrentUpdatesByDefaultMode;
        }
    } else {
        mode = TypeOfMode.NoMode;
    }

    if ( enableProfilerTimer && isDevToolsPresent ) {
        // Always collect profile timings when DevTools are present.
        // This enables DevTools to start capturing timing at any point–
        // Without some nodes in the tree having empty base times.
        mode |= TypeOfMode.ProfileMode;
    }

    return createFiber( WorkTag.HostRoot, null, null, mode );
}

export function createFiberFromFragment( elements: ReactFragment, mode: TypeOfMode, lanes: Lanes, key: null | string ): Fiber {
    const fiber = createFiber( WorkTag.Fragment, elements, key, mode );
    fiber.lanes = lanes;
    return fiber;
}

export function createFiberFromSuspense( pendingProps: any, mode: TypeOfMode, lanes: Lanes, key: null | string ): Fiber {
    const fiber = createFiber( WorkTag.SuspenseComponent, pendingProps, key, mode );
    fiber.elementType = REACT_SUSPENSE_TYPE;
    fiber.lanes = lanes;
    return fiber;
}

export function createFiberFromSuspenseList( pendingProps: any, mode: TypeOfMode, lanes: Lanes, key: null | string ): Fiber {
    const fiber = createFiber( WorkTag.SuspenseListComponent, pendingProps, key, mode );
    fiber.elementType = REACT_SUSPENSE_LIST_TYPE;
    fiber.lanes = lanes;
    return fiber;
}

export function createFiberFromCache( pendingProps: any, mode: TypeOfMode, lanes: Lanes, key: null | string ): Fiber {
    const fiber = createFiber( WorkTag.CacheComponent, pendingProps, key, mode );
    fiber.elementType = REACT_CACHE_TYPE;
    fiber.lanes = lanes;
    return fiber;
}

export function createFiberFromTracingMarker( pendingProps: any, mode: TypeOfMode, lanes: Lanes, key: null | string ): Fiber {
    const fiber = createFiber( WorkTag.TracingMarkerComponent, pendingProps, key, mode );
    fiber.elementType = REACT_TRACING_MARKER_TYPE;
    fiber.lanes = lanes;
    const tracingMarkerInstance: TracingMarkerInstance = {
        tag: TracingMarkerTag.TransitionTracingMarker,
        transitions: null,
        pendingBoundaries: null,
        aborts: null,
        name: pendingProps.name
    };
    fiber.stateNode = tracingMarkerInstance;
    return fiber;
}

export function createFiberFromText( content: string, mode: TypeOfMode, lanes: Lanes ): Fiber {
    const fiber = createFiber( WorkTag.HostText, content, null, mode );
    fiber.lanes = lanes;
    return fiber;
}

export function createFiberFromHostInstanceForDeletion(): Fiber {
    const fiber = createFiber( WorkTag.HostComponent, null, null, TypeOfMode.NoMode );
    fiber.elementType = "DELETED";
    return fiber;
}

export function createFiberFromDehydratedFragment( dehydratedNode: SuspenseInstance ): Fiber {
    const fiber = createFiber( WorkTag.DehydratedFragment, null, null, TypeOfMode.NoMode );
    fiber.stateNode = dehydratedNode;
    return fiber;
}

export function createFiberFromPortal( portal: ReactPortal, mode: TypeOfMode, lanes: Lanes ): Fiber {
    const pendingProps = portal.children !== null ? portal.children : [];
    const fiber = createFiber( WorkTag.HostPortal, pendingProps, portal.key, mode );
    fiber.lanes = lanes;
    fiber.stateNode = {
        containerInfo: portal.containerInfo,
        pendingChildren: null,
        // Used by persistent updates
        implementation: portal.implementation
    };
    return fiber;
}

// Used for stashing WIP properties to replay failed work in DEV.
export function assignFiberPropertiesInDEV( target: Fiber | null, source: Fiber ): Fiber {
    if ( target === null ) {
        // This Fiber's initial properties will always be overwritten.
        // We only use a Fiber to ensure the same hidden class so DEV isn't slow.
        target = createFiber( WorkTag.IndeterminateComponent, null, null, TypeOfMode.NoMode );
    }

    // This is intentionally written as a list of all properties.
    // We tried to use Object.assign() instead but this is called in
    // the hottest path, and Object.assign() was too slow:
    // https://github.com/facebook/react/issues/12502
    // This code is DEV-only so size is not a concern.
    target.tag = source.tag;
    target.key = source.key;
    target.elementType = source.elementType;
    target.type = source.type;
    target.stateNode = source.stateNode;
    target.return = source.return;
    target.child = source.child;
    target.sibling = source.sibling;
    target.index = source.index;
    target.ref = source.ref;
    target.refCleanup = source.refCleanup;
    target.pendingProps = source.pendingProps;
    target.memoizedProps = source.memoizedProps;
    target.updateQueue = source.updateQueue;
    target.memoizedState = source.memoizedState;
    target.dependencies = source.dependencies;
    target.mode = source.mode;
    target.flags = source.flags;
    target.subtreeFlags = source.subtreeFlags;
    target.deletions = source.deletions;
    target.lanes = source.lanes;
    target.childLanes = source.childLanes;
    target.alternate = source.alternate;

    if ( enableProfilerTimer ) {
        target.actualDuration = source.actualDuration;
        target.actualStartTime = source.actualStartTime;
        target.selfBaseDuration = source.selfBaseDuration;
        target.treeBaseDuration = source.treeBaseDuration;
    }

    target._debugSource = source._debugSource;
    target._debugOwner = source._debugOwner;
    target._debugNeedsRemount = source._debugNeedsRemount;
    target._debugHookTypes = source._debugHookTypes;
    return target;
}
