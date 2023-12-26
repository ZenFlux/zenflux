import type { JSX } from 'react/jsx-runtime';

export {};

declare global {
    namespace jest {
        interface Matchers<R> {
            toMatchRenderedOutput( element: JSX.Element ): R;
            toWarnDev(callback: () => void, expectedMessages: string[] | string, options?: object): R;
            toErrorDev(callback: () => void, expectedMessages: string[] | string, options?: object): R;
        }
    }
}
