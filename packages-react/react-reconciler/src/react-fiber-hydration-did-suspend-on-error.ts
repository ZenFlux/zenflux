// This flag allows for warning supression when we expect there to be mismatches
// due to earlier mismatches or a suspended fiber.

let didSuspendOrErrorDEV: boolean = false;

export function markDidThrowWhileHydratingDEV() {
    if ( __DEV__ ) {
        didSuspendOrErrorDEV = true;
    }
}

export function clearDidThrowWhileHydratingDEV() {
    didSuspendOrErrorDEV = false;
}

export function didntSuspendOrErrorWhileHydratingDEV(): boolean {
    return ! didSuspendOrErrorDEV;
}

export function didSuspendOrErrorWhileHydratingDEV(): boolean {
    return didSuspendOrErrorDEV;
}

export function didSuspendOrErrorWhileHydratingDEVSafe(): boolean {
    if ( __DEV__ ) {
        return didSuspendOrErrorDEV;
    }

    return false;
}
