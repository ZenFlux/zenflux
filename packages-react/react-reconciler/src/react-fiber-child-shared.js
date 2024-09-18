"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactChildFlags = exports.ReactChildFiberCurrent = void 0;
var thenableState = null;
var thenableIndexCounter = 0;
var didWarnAboutMaps;
var didWarnAboutGenerators;
var didWarnAboutStringRefs;
var ownerHasKeyUseWarning;
var ownerHasFunctionTypeWarning;
var ReactChildFiberCurrent = /** @class */ (function () {
    function ReactChildFiberCurrent() {
    }
    ReactChildFiberCurrent.thenableState = thenableState;
    ReactChildFiberCurrent.thenableIndexCounter = thenableIndexCounter;
    return ReactChildFiberCurrent;
}());
exports.ReactChildFiberCurrent = ReactChildFiberCurrent;
var ReactChildFlags = /** @class */ (function () {
    function ReactChildFlags() {
    }
    ReactChildFlags.didWarnAboutMaps = didWarnAboutMaps;
    ReactChildFlags.didWarnAboutGenerators = didWarnAboutGenerators;
    ReactChildFlags.didWarnAboutStringRefs = didWarnAboutStringRefs;
    ReactChildFlags.ownerHasKeyUseWarning = ownerHasKeyUseWarning;
    ReactChildFlags.ownerHasFunctionTypeWarning = ownerHasFunctionTypeWarning;
    return ReactChildFlags;
}());
exports.ReactChildFlags = ReactChildFlags;
