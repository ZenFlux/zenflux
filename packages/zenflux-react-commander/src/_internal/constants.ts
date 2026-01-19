const NAMESPACE = "@zenflux/react-commander";

export const REGISTER_INTERNAL_SYMBOL = Symbol.for( `${ NAMESPACE }/REGISTER_INTERNAL` );
export const UNREGISTER_INTERNAL_SYMBOL = Symbol.for( `${ NAMESPACE }/UNREGISTER_INTERNAL` );
export const GET_INTERNAL_SYMBOL = Symbol.for( `${ NAMESPACE }/GET_INTERNAL` );
export const GET_INTERNAL_MATCH_SYMBOL = Symbol.for( `${ NAMESPACE }/GET_INTERNAL_MATCH` );
export const SET_TO_CONTEXT_SYMBOL = Symbol.for( `${ NAMESPACE }/SET_TO_CONTEXT` );

export const INTERNAL_ON_LOAD = `${ NAMESPACE }/__internalOnLoad`;
export const INTERNAL_ON_MOUNT = `${ NAMESPACE }/__internalOnMount`;
export const INTERNAL_ON_UNMOUNT = `${ NAMESPACE }/__internalOnUnmount`;
export const INTERNAL_ON_UPDATE = `${ NAMESPACE }/__internalOnUpdate`;
export const INTERNAL_ON_CONTEXT_STATE_UPDATED = `${ NAMESPACE }/__internalOnContextStateUpdated`;

export const INTERNAL_PROPS = `${ NAMESPACE }/__internalProps`;

export const INTERNAL_STATE_UPDATED_EVENT = `${ NAMESPACE }/__internalStateUpdated`;
