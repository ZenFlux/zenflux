"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSITION_END = exports.ANIMATION_START = exports.ANIMATION_ITERATION = exports.ANIMATION_END = void 0;
var getVendorPrefixedEventName_1 = require("@zenflux/react-dom-bindings/src/events/getVendorPrefixedEventName");
exports.ANIMATION_END = (0, getVendorPrefixedEventName_1.default)("animationend");
exports.ANIMATION_ITERATION = (0, getVendorPrefixedEventName_1.default)("animationiteration");
exports.ANIMATION_START = (0, getVendorPrefixedEventName_1.default)("animationstart");
exports.TRANSITION_END = (0, getVendorPrefixedEventName_1.default)("transitionend");
