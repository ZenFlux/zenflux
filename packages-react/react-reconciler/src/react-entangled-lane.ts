import { allowConcurrentByDefault } from "@zenflux/react-shared/src/react-feature-flags";

import {
    DefaultLane,
    InputContinuousLane,
    NoLanes
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { pickArbitraryLaneIndex } from "@zenflux/react-reconciler/src/react-fiber-lane";

import type { FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";

// A contextual version of WorkInProgressRootRenderLanes. It is a superset of
// the lanes that we started working on at the root. When we enter a subtree
// that is currently hidden, we add the lanes that would have committed if
// the hidden tree hadn't been deferred. This is modified by the
// HiddenContext module.
//
// Most things in the work loop should deal with WorkInProgressRootRenderLanes.
// Most things in begin/complete phases should deal with entangledRenderLanes.

export let entangledRenderLanes: Lanes = NoLanes;

// This is called by the HiddenContext module when we enter or leave a
// hidden subtree. The stack logic is managed there because that's the only
// place that ever modifies it. Which module it lives in doesn't matter for
// performance because this function will get inlined regardless
export function setEntangledRenderLanes( newEntangledRenderLanes: Lanes ) {
    entangledRenderLanes = newEntangledRenderLanes;
}

export function getEntangledRenderLanes(): Lanes {
    return entangledRenderLanes;
}

export function getEntangledLanes( root: FiberRoot, renderLanes: Lanes ): Lanes {
    let entangledLanes = renderLanes;

    if ( allowConcurrentByDefault && ( root.current.mode & TypeOfMode.ConcurrentUpdatesByDefaultMode ) !== TypeOfMode.NoMode ) {// Do nothing, use the lanes as they were assigned.
    } else if ( ( entangledLanes & InputContinuousLane ) !== NoLanes ) {
        // When updates are sync by default, we entangle continuous priority updates
        // and default updates, so they render in the same batch. The only reason
        // they use separate lanes is because continuous updates should interrupt
        // transitions, but default updates should not.
        entangledLanes |= entangledLanes & DefaultLane;
    }

    // Check for entangled lanes and add them to the batch.
    //
    // A lane is said to be entangled with another when it's not allowed to render
    // in a batch that does not also include the other lane. Typically we do this
    // when multiple updates have the same source, and we only want to respond to
    // the most recent event from that source.
    //
    // Note that we apply entanglements *after* checking for partial work above.
    // This means that if a lane is entangled during an interleaved event while
    // it's already rendering, we won't interrupt it. This is intentional, since
    // entanglement is usually "best effort": we'll try our best to render the
    // lanes in the same batch, but it's not worth throwing out partially
    // completed work in order to do it.
    // TODO: Reconsider this. The counter-argument is that the partial work
    // represents an intermediate state, which we don't want to show to the user.
    // And by spending extra time finishing it, we're increasing the amount of
    // time it takes to show the final state, which is what they are actually
    // waiting for.
    //
    // For those exceptions where entanglement is semantically important,
    // we should ensure that there is no partial work at the
    // time we apply the entanglement.
    const allEntangledLanes = root.entangledLanes;

    if ( allEntangledLanes !== NoLanes ) {
        const entanglements = root.entanglements;
        let lanes = entangledLanes & allEntangledLanes;

        while ( lanes > 0 ) {
            const index = pickArbitraryLaneIndex( lanes );
            const lane = 1 << index;
            entangledLanes |= entanglements[ index ];
            lanes &= ~lane;
        }
    }

    return entangledLanes;
}

// TODO Move to react-entangled-root
export function markRootEntangled( root: FiberRoot, entangledLanes: Lanes ) {
    // In addition to entangling each of the given lanes with each other, we also
    // have to consider _transitive_ entanglements. For each lane that is already
    // entangled with *any* of the given lanes, that lane is now transitively
    // entangled with *all* the given lanes.
    //
    // Translated: If C is entangled with A, then entangling A with B also
    // entangles C with B.
    //
    // If this is hard to grasp, it might help to intentionally break this
    // function and look at the tests that fail in ReactTransition-test.js. Try
    // commenting out one of the conditions below.
    const rootEntangledLanes = root.entangledLanes |= entangledLanes;
    const entanglements = root.entanglements;
    let lanes = rootEntangledLanes;

    while ( lanes ) {
        const index = pickArbitraryLaneIndex( lanes );
        const lane = 1 << index;

        if ( // Is this one of the newly entangled lanes?
            lane & entangledLanes | // Is this lane transitively entangled with the newly entangled lanes?
            entanglements[ index ] & entangledLanes ) {
            entanglements[ index ] |= entangledLanes;
        }

        lanes &= ~lane;
    }
}

