import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export let shouldSuspendImpl = ( fiber: Fiber ) => false;

export function setShouldSuspend( impl: typeof shouldSuspendImpl ) {
    shouldSuspendImpl = impl;
}

export function shouldSuspend( fiber: Fiber ): boolean {
    return shouldSuspendImpl( fiber );
}
