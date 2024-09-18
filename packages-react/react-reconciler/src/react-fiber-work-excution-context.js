"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setExecutionContext = exports.getExecutionContext = exports.activateBatchedExecutionContext = exports.hasExecutionCommitContext = exports.activateExecutionCommitContext = exports.isExecutionContextRenderOrCommitActivate = exports.isExecutionContextRenderOrCommitDeactivate = exports.activateRenderExecutionContext = exports.isExecutionContextCommitDeactivate = exports.isExecutionContextRenderActivate = exports.isExecutionContextRenderDeactivate = exports.isExecutionContextNonEmpty = exports.isExecutionContextEmpty = void 0;
var NoContext = 
/*             */
0;
var BatchedContext = 
/*               */
1;
var RenderContext = 
/*         */
2;
var CommitContext = 
/*         */
4;
// Describes where we are in the React execution stack
var executionContext = NoContext;
function isExecutionContextEmpty() {
    return executionContext === NoContext;
}
exports.isExecutionContextEmpty = isExecutionContextEmpty;
function isExecutionContextNonEmpty() {
    return executionContext !== NoContext;
}
exports.isExecutionContextNonEmpty = isExecutionContextNonEmpty;
function isExecutionContextRenderDeactivate() {
    return (executionContext & RenderContext) !== NoContext;
}
exports.isExecutionContextRenderDeactivate = isExecutionContextRenderDeactivate;
function isExecutionContextRenderActivate() {
    return (executionContext & RenderContext) === NoContext;
}
exports.isExecutionContextRenderActivate = isExecutionContextRenderActivate;
function isExecutionContextCommitDeactivate() {
    return (executionContext & CommitContext) !== NoContext;
}
exports.isExecutionContextCommitDeactivate = isExecutionContextCommitDeactivate;
function activateRenderExecutionContext() {
    executionContext |= RenderContext;
}
exports.activateRenderExecutionContext = activateRenderExecutionContext;
function isExecutionContextRenderOrCommitDeactivate() {
    return (executionContext & (RenderContext | CommitContext)) !== NoContext;
}
exports.isExecutionContextRenderOrCommitDeactivate = isExecutionContextRenderOrCommitDeactivate;
function isExecutionContextRenderOrCommitActivate() {
    return (executionContext & (RenderContext | CommitContext)) === NoContext;
}
exports.isExecutionContextRenderOrCommitActivate = isExecutionContextRenderOrCommitActivate;
function activateExecutionCommitContext() {
    executionContext |= CommitContext;
}
exports.activateExecutionCommitContext = activateExecutionCommitContext;
function hasExecutionCommitContext() {
    return (executionContext & CommitContext);
}
exports.hasExecutionCommitContext = hasExecutionCommitContext;
function activateBatchedExecutionContext() {
    executionContext |= BatchedContext;
}
exports.activateBatchedExecutionContext = activateBatchedExecutionContext;
function getExecutionContext() {
    return executionContext;
}
exports.getExecutionContext = getExecutionContext;
function setExecutionContext(context) {
    executionContext = context;
}
exports.setExecutionContext = setExecutionContext;
