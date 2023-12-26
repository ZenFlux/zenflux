type ExecutionContext = number;

const NoContext =
    /*             */
    0b000;
const BatchedContext =
    /*               */
    0b001;
const RenderContext =
    /*         */
    0b010;
const CommitContext =
    /*         */
    0b100;

// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;

export function isExecutionContextEmpty() {
    return executionContext === NoContext;
}

export function isExecutionContextNonEmpty() {
    return executionContext !== NoContext;
}

export function isExecutionContextRenderDeactivate() {
    return ( executionContext & RenderContext ) !== NoContext;
}

export function isExecutionContextRenderActivate() {
    return ( executionContext & RenderContext ) === NoContext;
}

export function isExecutionContextCommitDeactivate() {
    return ( executionContext & CommitContext ) !== NoContext;
}

export function activateRenderExecutionContext() {
    executionContext |= RenderContext;
}

export function isExecutionContextRenderOrCommitDeactivate() {
    return ( executionContext & ( RenderContext | CommitContext ) ) !== NoContext;
}

export function isExecutionContextRenderOrCommitActivate() {
    return ( executionContext & ( RenderContext | CommitContext ) ) === NoContext;
}

export function activateExecutionCommitContext() {
    executionContext |= CommitContext;
}

export function hasExecutionCommitContext() {
    return ( executionContext & CommitContext );
}

export function activateBatchedExecutionContext() {
    executionContext |= BatchedContext;
}

export function getExecutionContext() {
    return executionContext;
}

export function setExecutionContext( context: ExecutionContext ) {
    executionContext = context;
}
