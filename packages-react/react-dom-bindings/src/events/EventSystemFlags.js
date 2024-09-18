"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS = exports.SHOULD_NOT_DEFER_CLICK_FOR_FB_SUPPORT_MODE = exports.IS_LEGACY_FB_SUPPORT_MODE = exports.IS_PASSIVE = exports.IS_CAPTURE_PHASE = exports.IS_NON_DELEGATED = exports.IS_EVENT_HANDLE_NON_MANAGED_NODE = void 0;
exports.IS_EVENT_HANDLE_NON_MANAGED_NODE = 1;
exports.IS_NON_DELEGATED = 1 << 1;
exports.IS_CAPTURE_PHASE = 1 << 2;
exports.IS_PASSIVE = 1 << 3;
exports.IS_LEGACY_FB_SUPPORT_MODE = 1 << 4;
exports.SHOULD_NOT_DEFER_CLICK_FOR_FB_SUPPORT_MODE = exports.IS_LEGACY_FB_SUPPORT_MODE | exports.IS_CAPTURE_PHASE;
// We do not want to defer if the event system has already been
// set to LEGACY_FB_SUPPORT. LEGACY_FB_SUPPORT only gets set when
// we call willDeferLaterForLegacyFBSupport, thus not bailing out
// will result in endless cycles like an infinite loop.
// We also don't want to defer during event replaying.
exports.SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS = exports.IS_EVENT_HANDLE_NON_MANAGED_NODE | exports.IS_NON_DELEGATED | exports.IS_CAPTURE_PHASE;
