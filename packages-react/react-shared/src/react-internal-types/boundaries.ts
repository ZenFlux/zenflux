/* eslint-disable no-restricted-imports */

import type { OffscreenInstance } from "./offscreen";
import type { SuspenseInfo } from "./suspense";

export type PendingBoundaries = Map<OffscreenInstance, SuspenseInfo>;
