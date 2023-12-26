let legacyErrorBoundariesThatAlreadyFailed: Set<unknown> | null = null;

export function isAlreadyFailedLegacyErrorBoundary( instance: unknown ): boolean {
    return legacyErrorBoundariesThatAlreadyFailed !== null && legacyErrorBoundariesThatAlreadyFailed.has( instance );
}

export function markLegacyErrorBoundaryAsFailed( instance: unknown ) {
    if ( legacyErrorBoundariesThatAlreadyFailed === null ) {
        legacyErrorBoundariesThatAlreadyFailed = new Set( [ instance ] );
    } else {
        legacyErrorBoundariesThatAlreadyFailed.add( instance );
    }
}

export function setLegacyErrorBoundariesThatAlreadyFailed( failedBoundaries: Set<unknown> | null ) {
    legacyErrorBoundariesThatAlreadyFailed = failedBoundaries;
}

export function clearLegacyErrorBoundariesThatAlreadyFailed() {
    legacyErrorBoundariesThatAlreadyFailed = null;
}
