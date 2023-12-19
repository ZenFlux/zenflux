/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;
// TODO: Use symbols?
export const NoPriority = 0;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;

declare global {
    namespace globalThis {
        var __REACT_SCHEDULER_DEF__: boolean;
    }
}

// Added by ZenFlux - Debug protection to make sure we don't double-define the package.
if ( "undefined" === typeof globalThis.__REACT_SCHEDULER_DEF__ ) {
    globalThis.__REACT_SCHEDULER_DEF__ = true;
} else {
    throw new Error( "Scheduler already loaded" );
}
