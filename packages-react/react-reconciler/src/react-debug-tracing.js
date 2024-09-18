"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStateUpdateScheduled = exports.logForceUpdateScheduled = exports.logRenderStopped = exports.logRenderStarted = exports.logPassiveEffectsStopped = exports.logPassiveEffectsStarted = exports.logLayoutEffectsStopped = exports.logLayoutEffectsStarted = exports.logComponentSuspended = exports.logCommitStopped = exports.logCommitStarted = void 0;
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var nativeConsole = console;
var nativeConsoleLog = null;
var pendingGroupArgs = [];
var printedGroupIndex = -1;
function formatLanes(laneOrLanes) {
    return "0b" + laneOrLanes.toString(2).padStart(31, "0");
}
function group() {
    var groupArgs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        groupArgs[_i] = arguments[_i];
    }
    pendingGroupArgs.push(groupArgs);
    if (nativeConsoleLog === null) {
        nativeConsoleLog = nativeConsole.log;
        nativeConsole.log = log;
    }
}
function groupEnd() {
    pendingGroupArgs.pop();
    while (printedGroupIndex >= pendingGroupArgs.length) {
        nativeConsole.groupEnd();
        printedGroupIndex--;
    }
    if (pendingGroupArgs.length === 0) {
        nativeConsole.log = nativeConsoleLog;
        nativeConsoleLog = null;
    }
}
function log() {
    var logArgs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        logArgs[_i] = arguments[_i];
    }
    if (printedGroupIndex < pendingGroupArgs.length - 1) {
        for (var i = printedGroupIndex + 1; i < pendingGroupArgs.length; i++) {
            var groupArgs = pendingGroupArgs[i];
            nativeConsole.group.apply(nativeConsole, groupArgs);
        }
        printedGroupIndex = pendingGroupArgs.length - 1;
    }
    if (typeof nativeConsoleLog === "function") {
        nativeConsoleLog.apply(void 0, logArgs);
    }
    else {
        nativeConsole.log.apply(nativeConsole, logArgs);
    }
}
var REACT_LOGO_STYLE = "background-color: #20232a; color: #61dafb; padding: 0 2px;";
function logCommitStarted(lanes) {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            group("%c\u269B\uFE0F%c commit%c (".concat(formatLanes(lanes), ")"), REACT_LOGO_STYLE, "", "font-weight: normal;");
        }
    }
}
exports.logCommitStarted = logCommitStarted;
function logCommitStopped() {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            groupEnd();
        }
    }
}
exports.logCommitStopped = logCommitStopped;
var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
// @ts-expect-error[incompatible-type]: Flow cannot handle polymorphic WeakMaps
var wakeableIDs = new PossiblyWeakMap();
var wakeableID = 0;
function getWakeableID(wakeable) {
    if (!wakeableIDs.has(wakeable)) {
        wakeableIDs.set(wakeable, wakeableID++);
    }
    return wakeableIDs.get(wakeable);
}
function logComponentSuspended(componentName, wakeable) {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            var id_1 = getWakeableID(wakeable);
            var display_1 = wakeable.displayName || wakeable;
            log("%c\u269B\uFE0F%c ".concat(componentName, " suspended"), REACT_LOGO_STYLE, "color: #80366d; font-weight: bold;", id_1, display_1);
            wakeable.then(function () {
                log("%c\u269B\uFE0F%c ".concat(componentName, " resolved"), REACT_LOGO_STYLE, "color: #80366d; font-weight: bold;", id_1, display_1);
            }, function () {
                log("%c\u269B\uFE0F%c ".concat(componentName, " rejected"), REACT_LOGO_STYLE, "color: #80366d; font-weight: bold;", id_1, display_1);
            });
        }
    }
}
exports.logComponentSuspended = logComponentSuspended;
function logLayoutEffectsStarted(lanes) {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            group("%c\u269B\uFE0F%c layout effects%c (".concat(formatLanes(lanes), ")"), REACT_LOGO_STYLE, "", "font-weight: normal;");
        }
    }
}
exports.logLayoutEffectsStarted = logLayoutEffectsStarted;
function logLayoutEffectsStopped() {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            groupEnd();
        }
    }
}
exports.logLayoutEffectsStopped = logLayoutEffectsStopped;
function logPassiveEffectsStarted(lanes) {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            group("%c\u269B\uFE0F%c passive effects%c (".concat(formatLanes(lanes), ")"), REACT_LOGO_STYLE, "", "font-weight: normal;");
        }
    }
}
exports.logPassiveEffectsStarted = logPassiveEffectsStarted;
function logPassiveEffectsStopped() {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            groupEnd();
        }
    }
}
exports.logPassiveEffectsStopped = logPassiveEffectsStopped;
function logRenderStarted(lanes) {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            group("%c\u269B\uFE0F%c render%c (".concat(formatLanes(lanes), ")"), REACT_LOGO_STYLE, "", "font-weight: normal;");
        }
    }
}
exports.logRenderStarted = logRenderStarted;
function logRenderStopped() {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            groupEnd();
        }
    }
}
exports.logRenderStopped = logRenderStopped;
function logForceUpdateScheduled(componentName, lane) {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            log("%c\u269B\uFE0F%c ".concat(componentName, " forced update %c(").concat(formatLanes(lane), ")"), REACT_LOGO_STYLE, "color: #db2e1f; font-weight: bold;", "");
        }
    }
}
exports.logForceUpdateScheduled = logForceUpdateScheduled;
function logStateUpdateScheduled(componentName, lane, payloadOrAction) {
    if (__DEV__) {
        if (react_feature_flags_1.enableDebugTracing) {
            log("%c\u269B\uFE0F%c ".concat(componentName, " updated state %c(").concat(formatLanes(lane), ")"), REACT_LOGO_STYLE, "color: #01a252; font-weight: bold;", "", payloadOrAction);
        }
    }
}
exports.logStateUpdateScheduled = logStateUpdateScheduled;
