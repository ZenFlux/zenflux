"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearWarningAboutReassigningProps = exports.didWarnAboutReassigningProps = exports.markWarningAboutReassigningProps = void 0;
var _didWarnAboutReassigningProps;
function markWarningAboutReassigningProps() {
    _didWarnAboutReassigningProps = true;
}
exports.markWarningAboutReassigningProps = markWarningAboutReassigningProps;
function didWarnAboutReassigningProps() {
    return _didWarnAboutReassigningProps;
}
exports.didWarnAboutReassigningProps = didWarnAboutReassigningProps;
function clearWarningAboutReassigningProps() {
    _didWarnAboutReassigningProps = false;
}
exports.clearWarningAboutReassigningProps = clearWarningAboutReassigningProps;
