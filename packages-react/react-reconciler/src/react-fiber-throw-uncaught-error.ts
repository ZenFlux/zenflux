let _hasUncaughtError = false;
let _firstUncaughtError: unknown = null;

export const onUncaughtError = function ( error: unknown ) {
    if ( ! _hasUncaughtError ) {
        _hasUncaughtError = true;
        _firstUncaughtError = error;
    }
};

export function clearUncaughtError() {
    _hasUncaughtError = false;
}

export function clearFirstUncaughtError() {
    _firstUncaughtError = null;
}

export function setFirstUncaughtError( error: unknown ) {
    _firstUncaughtError = error;
}

export function getFirstUncaughtError() {
    return _firstUncaughtError;
}

export function hasUncaughtError() {
    return _hasUncaughtError;
}

