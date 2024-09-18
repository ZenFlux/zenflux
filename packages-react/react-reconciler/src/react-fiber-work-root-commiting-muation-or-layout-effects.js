"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setRootCommittingMutationOrLayoutEffects = exports.clearRootCommittingMutationOrLayoutEffects = exports.isRootCommittingMutationOrLayoutEffects = void 0;
// Only used when enableProfilerNestedUpdateScheduledHook is true;
// to track which root is currently committing layout effects.
var rootCommittingMutationOrLayoutEffects = null;
function isRootCommittingMutationOrLayoutEffects(root) {
    return root === rootCommittingMutationOrLayoutEffects;
}
exports.isRootCommittingMutationOrLayoutEffects = isRootCommittingMutationOrLayoutEffects;
function clearRootCommittingMutationOrLayoutEffects() {
    rootCommittingMutationOrLayoutEffects = null;
}
exports.clearRootCommittingMutationOrLayoutEffects = clearRootCommittingMutationOrLayoutEffects;
function setRootCommittingMutationOrLayoutEffects(root) {
    rootCommittingMutationOrLayoutEffects = root;
}
exports.setRootCommittingMutationOrLayoutEffects = setRootCommittingMutationOrLayoutEffects;
