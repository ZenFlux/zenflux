// Same as https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/client/ReactDOMComponentTree.js#L39
const randomKey = "__" + Math.random().toString( 36 ).slice( 2 );

export const REGISTER_INTERNAL_SYMBOL = Symbol( "REGISTER_INTERNAL" + randomKey );
export const UNREGISTER_INTERNAL_SYMBOL = Symbol( "UNREGISTER_INTERNAL" + randomKey );
export const GET_INTERNAL_SYMBOL = Symbol( "GET_INTERNAL" + randomKey );
export const GET_INTERNAL_MATCH_SYMBOL = Symbol( "GET_INTERNAL_MATCH" + randomKey );
export const SET_TO_CONTEXT_SYMBOL = Symbol( "SET_TO_CONTEXT" + randomKey );

export const INTERNAL_ON_LOAD = "__internalOnLoad" + randomKey;
export const INTERNAL_ON_MOUNT = "__internalOnMount" + randomKey;
export const INTERNAL_ON_UNMOUNT = "__internalOnUnmount" + randomKey;
export const INTERNAL_ON_UPDATE = "__internalOnUpdate" + randomKey;

export const INTERNAL_PROPS = "__internalProps" + randomKey;

export const INTERNAL_STATE_UPDATED_EVENT = "__internalStateUpdated" + randomKey;
