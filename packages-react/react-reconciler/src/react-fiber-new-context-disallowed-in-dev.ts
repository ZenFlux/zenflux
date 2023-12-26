let _isDisallowedContextReadInDEV: boolean = false;

export function enterDisallowedContextReadInDEV(): void {
    if ( __DEV__ ) {
        _isDisallowedContextReadInDEV = true;
    }
}

export function exitDisallowedContextReadInDEV(): void {
    if ( __DEV__ ) {
        _isDisallowedContextReadInDEV = false;
    }
}

export function isDisallowedContextReadInDEV(): boolean {
    if ( __DEV__ ) {
        return _isDisallowedContextReadInDEV;
    }

    return false;
}
