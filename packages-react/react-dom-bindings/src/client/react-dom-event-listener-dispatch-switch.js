"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEnabled = exports.setEnabled = void 0;
var _enabled = true;
// This is exported in FB builds for use by legacy FB layer infra.
// We'd like to remove this but it's not clear if this is safe.
function setEnabled(enabled) {
    _enabled = !!enabled;
}
exports.setEnabled = setEnabled;
function isEnabled() {
    return _enabled;
}
exports.isEnabled = isEnabled;
