import ZenCore from "@zenflux/core";

import { Logger } from "@zenflux/logging/src/modules/logger";

// Attach logger module to the core
ZenCore.classes.Logger = Logger;
