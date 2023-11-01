import { classes } from "@zenflux/core";

import { Logger } from "@z-logging/modules/logger";

// Attach logger module to the core
classes.Logger = Logger;
