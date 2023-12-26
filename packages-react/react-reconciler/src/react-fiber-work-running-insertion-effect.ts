let isRunningInsertionEffect = false;

export function setIsRunningInsertionEffect( isRunning: boolean ): void {
    if ( __DEV__ ) {
        isRunningInsertionEffect = isRunning;
    }
}

export function getIsRunningInsertionEffect(): boolean {
    return isRunningInsertionEffect;
}
