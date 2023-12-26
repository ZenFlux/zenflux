import type { FiberRoot } from "@zenflux/react-shared/src/react-internal-types";

// Use these to prevent an infinite loop of nested updates
const NESTED_UPDATE_LIMIT = 50;
const NESTED_PASSIVE_UPDATE_LIMIT = 50;

let nestedUpdateCount: number = 0;
let nestedPassiveUpdateCount: number = 0;

let rootWithNestedUpdates: FiberRoot | null = null;
let rootWithPassiveNestedUpdates: FiberRoot | null = null;

// ----
// Nested update count
// ----
export function resetNestedUpdateCount() {
    nestedUpdateCount = 0;
}

export function incrementNestedUpdateCount() {
    nestedUpdateCount++;
}

export function isNestedUpdateLimitExceeded() {
    return nestedUpdateCount > NESTED_UPDATE_LIMIT;
}

// ----
// Nested passive update count
// ----
export function resetNestedPassiveUpdateCount() {
    nestedPassiveUpdateCount = 0;
}

export function incrementNestedPassiveUpdateCount() {
    nestedPassiveUpdateCount++;
}

// ----
// Root with nested updates
// ----
export function isNestedRootWithNestedUpdates( root: FiberRoot ) {
    return root === rootWithNestedUpdates;
}

export function setNestedRootWithNestedUpdates( root: FiberRoot ) {
    rootWithNestedUpdates = root;
}

// ----
// Root with nested passive updates
// ----
export function isNestedRootWithPassiveUpdate( root: FiberRoot ) {
    return root === rootWithPassiveNestedUpdates;
}

export function setNestedRootWithPassiveUpdate( root: FiberRoot ) {
    rootWithPassiveNestedUpdates = root;
}

export function resetNestedRootWithPassiveNestedUpdates() {
    rootWithPassiveNestedUpdates = null;
}

export function throwIfInfiniteUpdateLoopDetected() {
    if ( isNestedUpdateLimitExceeded() ) {
        resetNestedUpdateCount();
        nestedPassiveUpdateCount = 0;
        rootWithNestedUpdates = null;
        rootWithPassiveNestedUpdates = null;
        throw new Error( "Maximum update depth exceeded. This can happen when a component " + "repeatedly calls setState inside componentWillUpdate or " + "componentDidUpdate. React limits the number of nested updates to " + "prevent infinite loops." );
    }

    if ( __DEV__ ) {
        if ( nestedPassiveUpdateCount > NESTED_PASSIVE_UPDATE_LIMIT ) {
            nestedPassiveUpdateCount = 0;
            rootWithPassiveNestedUpdates = null;
            console.error( "Maximum update depth exceeded. This can happen when a component " + "calls setState inside useEffect, but useEffect either doesn't " + "have a dependency array, or one of the dependencies changes on " + "every render." );
        }
    }
}
