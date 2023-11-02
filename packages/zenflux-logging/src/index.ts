import ZenCore from "@zenflux/core";

import { Logger } from "@z-logging/modules/logger";

// Attach logger module to the core
ZenCore.classes.Logger = Logger;
