"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyRoot = exports.ConcurrentRoot = exports.IdleEventPriority = exports.DefaultEventPriority = exports.ContinuousEventPriority = exports.DiscreteEventPriority = void 0;
// These are semi-public constants exposed to any third-party renderers.
// Only expose the minimal subset necessary to implement a host config.
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
Object.defineProperty(exports, "DiscreteEventPriority", { enumerable: true, get: function () { return react_event_priorities_1.DiscreteEventPriority; } });
Object.defineProperty(exports, "ContinuousEventPriority", { enumerable: true, get: function () { return react_event_priorities_1.ContinuousEventPriority; } });
Object.defineProperty(exports, "DefaultEventPriority", { enumerable: true, get: function () { return react_event_priorities_1.DefaultEventPriority; } });
Object.defineProperty(exports, "IdleEventPriority", { enumerable: true, get: function () { return react_event_priorities_1.IdleEventPriority; } });
var root_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/root-tags");
Object.defineProperty(exports, "ConcurrentRoot", { enumerable: true, get: function () { return root_tags_1.ConcurrentRoot; } });
Object.defineProperty(exports, "LegacyRoot", { enumerable: true, get: function () { return root_tags_1.LegacyRoot; } });
