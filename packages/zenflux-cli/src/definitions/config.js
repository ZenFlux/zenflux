"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Z_CONFIG_REQUIRED_KEYS = exports.Z_CONFIG_REQUIRED = exports.Z_CONFIG_DEFAULTS = void 0;
;
;
;
/**
 * @internal
 */
exports.Z_CONFIG_DEFAULTS = {
    extensions: [".ts", ".js"],
};
/**
 * @internal
 */
exports.Z_CONFIG_REQUIRED = {
    inputPath: true,
    outputFileName: true,
};
exports.Z_CONFIG_REQUIRED_KEYS = Object.keys(exports.Z_CONFIG_REQUIRED);
