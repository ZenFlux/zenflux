import type { CapturedValue } from "@zenflux/react-reconciler/src/react-captured-value";

// Hydration errors that were thrown inside this boundary
let hydrationErrors: Array<CapturedValue<unknown>> | null = null;

export function queueHydrationError( error: CapturedValue<unknown> ): void {
    if ( hydrationErrors === null ) {
        hydrationErrors = [ error ];
    } else {
        hydrationErrors.push( error );
    }
}

export function clearHydrationErrors(): void {
    hydrationErrors = null;
}

export function hasHydrationErrors() {
    return hydrationErrors !== null;
}

export function getHydrationErrorsSafe() {
    return hydrationErrors!;
}
