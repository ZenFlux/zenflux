let _isHydrating: boolean = false;

export function isHydrating(): boolean {
    return _isHydrating;
}

export function markHydrating(): void {
    _isHydrating = true;
}

export function freeHydrating(): void {
    _isHydrating = false;
}
