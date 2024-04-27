/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactSharedInternals.js
 */
import type { ReactType } from "@zenflux/react-x-env/src/react-internals";

const ReactSharedInternals = ( global.React as typeof ReactType ).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

export default ReactSharedInternals;
