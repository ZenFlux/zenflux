let _enabled: boolean = true;
// This is exported in FB builds for use by legacy FB layer infra.
// We'd like to remove this but it's not clear if this is safe.
export function setEnabled( enabled: boolean | null | undefined ): void {
    _enabled = !! enabled;
}

export function isEnabled(): boolean {
    return _enabled;
}
