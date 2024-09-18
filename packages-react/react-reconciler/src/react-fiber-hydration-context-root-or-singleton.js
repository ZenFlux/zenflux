"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearRootOrSingletonContextFlag = exports.setRootOrSingletonContextFlag = exports.hasRootOrSingletonContextFlag = void 0;
var rootOrSingletonContext = false;
function hasRootOrSingletonContextFlag() {
    return rootOrSingletonContext;
}
exports.hasRootOrSingletonContextFlag = hasRootOrSingletonContextFlag;
function setRootOrSingletonContextFlag() {
    rootOrSingletonContext = true;
}
exports.setRootOrSingletonContextFlag = setRootOrSingletonContextFlag;
function clearRootOrSingletonContextFlag() {
    rootOrSingletonContext = false;
}
exports.clearRootOrSingletonContextFlag = clearRootOrSingletonContextFlag;
