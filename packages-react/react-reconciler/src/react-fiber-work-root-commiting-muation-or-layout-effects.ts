import type { FiberRoot } from "@zenflux/react-shared/src/react-internal-types";

// Only used when enableProfilerNestedUpdateScheduledHook is true;
// to track which root is currently committing layout effects.

let rootCommittingMutationOrLayoutEffects: FiberRoot | null = null;

export function isRootCommittingMutationOrLayoutEffects( root: FiberRoot ) {
    return root === rootCommittingMutationOrLayoutEffects;
}

export function clearRootCommittingMutationOrLayoutEffects() {
    rootCommittingMutationOrLayoutEffects = null;
}

export function setRootCommittingMutationOrLayoutEffects( root: FiberRoot ) {
    rootCommittingMutationOrLayoutEffects = root;
}
