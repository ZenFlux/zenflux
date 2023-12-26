export const updateDebugValue = mountDebugValue;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function mountDebugValue<T>( value: T, formatterFn: ( ( value: T ) => unknown ) | null | undefined ): void {// This hook is normally a no-op.
    // The react-debug-hooks package injects its own implementation
    // so that e.g. DevTools can display custom hook values.
}
