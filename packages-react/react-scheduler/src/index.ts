/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
"use strict";

export const isTestEnvironment = false;

export * from "@zenflux/react-scheduler/src/forks/scheduler";

// this doesn't actually exist on the scheduler, but it *does*
// on scheduler/unstable_mock, which we'll need for internal testing
export { unstable_setDisableYieldValue, log } from "@zenflux/react-scheduler/src/forks/scheduler-mock";
