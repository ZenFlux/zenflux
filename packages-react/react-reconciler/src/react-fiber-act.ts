import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import type { Fiber } from "@zenflux/react-reconciler/src/react-fiber-config";

const {
    warnsIfNotActing
} = globalThis.__RECONCILER__CONFIG__;

const {
    ReactCurrentActQueue
} = ReactSharedInternals;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isLegacyActEnvironment( fiber: Fiber ): boolean {
    if ( __DEV__ ) {
        // Legacy mode. We preserve the behavior of React 17's act. It assumes an
        // act environment whenever `jest` is defined, but you can still turn off
        // spurious warnings by setting IS_REACT_ACT_ENVIRONMENT explicitly
        // to false.
        const isReactActEnvironmentGlobal = // $FlowFixMe[cannot-resolve-name] Flow doesn't know about IS_REACT_ACT_ENVIRONMENT global
            typeof IS_REACT_ACT_ENVIRONMENT !== "undefined" ? // $FlowFixMe[cannot-resolve-name]
                IS_REACT_ACT_ENVIRONMENT : undefined;

        // @ts-ignore
        const jestIsDefined = typeof jest !== "undefined";

        return warnsIfNotActing && jestIsDefined && isReactActEnvironmentGlobal !== false;
    }

    return false;
}

export function isConcurrentActEnvironment(): void | boolean {
    if ( __DEV__ ) {
        const isReactActEnvironmentGlobal = // $FlowFixMe[cannot-resolve-name] Flow doesn't know about IS_REACT_ACT_ENVIRONMENT global
            typeof IS_REACT_ACT_ENVIRONMENT !== "undefined" ? // $FlowFixMe[cannot-resolve-name]
                IS_REACT_ACT_ENVIRONMENT : undefined;

        if ( ! isReactActEnvironmentGlobal && ReactCurrentActQueue.current !== null ) {
            // TODO: Include link to relevant documentation page.
            console.error( "The current testing environment is not configured to support " + "act(...)" );
        }

        return isReactActEnvironmentGlobal;
    }

    return false;
}
