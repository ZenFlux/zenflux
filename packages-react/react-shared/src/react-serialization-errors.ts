/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactSerializationErrors.js
 */
import {
    REACT_ELEMENT_TYPE,
    REACT_FORWARD_REF_TYPE,
    REACT_LAZY_TYPE,
    REACT_MEMO_TYPE,
    REACT_SUSPENSE_LIST_TYPE,
    REACT_SUSPENSE_TYPE
} from "@zenflux/react-shared/src/react-symbols";

import type { LazyComponent } from "@zenflux/react-shared/src/lazy-component";
import type { ReactElement } from "@zenflux/react-shared/src/react-element-type";

// Used for DEV messages to keep track of which parent rendered some props,
// in case they error.
export const jsxPropsParents: WeakMap<any, any> = new WeakMap();
export const jsxChildrenParents: WeakMap<any, any> = new WeakMap();

function isObjectPrototype( object: any ): boolean {
    if ( ! object ) {
        return false;
    }

    const ObjectPrototype = Object.prototype;

    if ( object === ObjectPrototype ) {
        return true;
    }

    // It might be an object from a different Realm which is
    // still just a plain simple object.
    if ( Object.getPrototypeOf( object ) ) {
        return false;
    }

    const names = Object.getOwnPropertyNames( object );

    for ( let i = 0 ; i < names.length ; i++ ) {
        if ( ! ( names[ i ] in ObjectPrototype ) ) {
            return false;
        }
    }

    return true;
}

export function isSimpleObject( object: any ): boolean {
    if ( ! isObjectPrototype( Object.getPrototypeOf( object ) ) ) {
        return false;
    }

    const names = Object.getOwnPropertyNames( object );

    for ( let i = 0 ; i < names.length ; i++ ) {
        const descriptor = Object.getOwnPropertyDescriptor( object, names[ i ] );

        if ( ! descriptor ) {
            return false;
        }

        if ( ! descriptor.enumerable ) {
            if ( ( names[ i ] === "key" || names[ i ] === "ref" ) && typeof descriptor.get === "function" ) {
                // React adds key and ref getters to props objects to issue warnings.
                // Those getters will not be transferred to the client, but that's ok,
                // so we'll special case them.
                continue;
            }

            return false;
        }
    }

    return true;
}

export function objectName( object: unknown ): string {
    const name = Object.prototype.toString.call( object );
    return name.replace( /^\[object (.*)\]$/, function ( m, p0 ) {
        return p0;
    } );
}

function describeKeyForErrorMessage( key: string ): string {
    const encodedKey = JSON.stringify( key );
    return "\"" + key + "\"" === encodedKey ? key : encodedKey;
}

export function describeValueForErrorMessage( value: unknown ): string {
    switch ( typeof value ) {
        case "string": {
            return JSON.stringify( value.length <= 10 ? value : value.slice( 0, 10 ) + "..." );
        }

        case "object": {
            if ( Array.isArray( value ) ) {
                return "[...]";
            }

            const name = objectName( value );

            if ( name === "Object" ) {
                return "{...}";
            }

            return name;
        }

        case "function":
            return "function";

        default:
            return String( value );
    }
}

function describeElementType( type: any ): string {
    if ( typeof type === "string" ) {
        return type;
    }

    switch ( type ) {
        case REACT_SUSPENSE_TYPE:
            return "Suspense";

        case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
    }

    if ( typeof type === "object" ) {
        switch ( type.$$typeof ) {
            case REACT_FORWARD_REF_TYPE:
                return describeElementType( type.render );

            case REACT_MEMO_TYPE:
                return describeElementType( type.type );

            case REACT_LAZY_TYPE: {
                const lazyComponent: LazyComponent<any, any> = ( type as any );
                const payload = lazyComponent._payload;
                const init = lazyComponent._init;

                try {
                    // Lazy may contain any component type so we recursively resolve it.
                    return describeElementType( init( payload ) );
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch ( x ) {
                }
            }
        }
    }

    return "";
}

export function describeObjectForErrorMessage( objectOrArray: ( { [key in string | number]?: unknown } ) | ReadonlyArray<unknown>, expandedName?: string ): string {
    const objKind = objectName( objectOrArray );

    if ( objKind !== "Object" && objKind !== "Array" ) {
        return objKind;
    }

    let str = "";
    let start = -1;
    let length = 0;

    if ( Array.isArray( objectOrArray ) ) {
        if ( __DEV__ && jsxChildrenParents.has( objectOrArray ) ) {
            // Print JSX Children
            const type = jsxChildrenParents.get( objectOrArray );
            str = "<" + describeElementType( type ) + ">";
            const array: ReadonlyArray<unknown> = objectOrArray;

            for ( let i = 0 ; i < array.length ; i++ ) {
                const value = array[ i ];
                let substr;

                if ( typeof value === "string" ) {
                    substr = value;
                } else if ( typeof value === "object" && value !== null ) {
                    substr = "{" + describeObjectForErrorMessage( value ) + "}";
                } else {
                    substr = "{" + describeValueForErrorMessage( value ) + "}";
                }

                if ( "" + i === expandedName ) {
                    start = str.length;
                    length = substr.length;
                    str += substr;
                } else if ( substr.length < 15 && str.length + substr.length < 40 ) {
                    str += substr;
                } else {
                    str += "{...}";
                }
            }

            str += "</" + describeElementType( type ) + ">";
        } else {
            // Print Array
            str = "[";
            const array: ReadonlyArray<unknown> = objectOrArray;

            for ( let i = 0 ; i < array.length ; i++ ) {
                if ( i > 0 ) {
                    str += ", ";
                }

                const value = array[ i ];
                let substr;

                if ( typeof value === "object" && value !== null ) {
                    substr = describeObjectForErrorMessage( value );
                } else {
                    substr = describeValueForErrorMessage( value );
                }

                if ( "" + i === expandedName ) {
                    start = str.length;
                    length = substr.length;
                    str += substr;
                } else if ( substr.length < 10 && str.length + substr.length < 40 ) {
                    str += substr;
                } else {
                    str += "...";
                }
            }

            str += "]";
        }
    } else {
        if ( (objectOrArray as ReactElement).$$typeof === REACT_ELEMENT_TYPE ) {
            str = "<" + describeElementType( (objectOrArray as ReactElement).type ) + "/>";
        } else if ( __DEV__ && jsxPropsParents.has( objectOrArray ) ) {
            // Print JSX
            const type = jsxPropsParents.get( objectOrArray );
            str = "<" + ( describeElementType( type ) || "..." );

            const object: { [ key: string | number | symbol ]: any} = objectOrArray;
            const names = Object.keys( object );

            for ( let i = 0 ; i < names.length ; i++ ) {
                str += " ";
                const name = names[ i ];
                str += describeKeyForErrorMessage( name ) + "=";
                const value = object[ name ];
                let substr;

                if ( name === expandedName && typeof value === "object" && value !== null ) {
                    substr = describeObjectForErrorMessage( value );
                } else {
                    substr = describeValueForErrorMessage( value );
                }

                if ( typeof value !== "string" ) {
                    substr = "{" + substr + "}";
                }

                if ( name === expandedName ) {
                    start = str.length;
                    length = substr.length;
                    str += substr;
                } else if ( substr.length < 10 && str.length + substr.length < 40 ) {
                    str += substr;
                } else {
                    str += "...";
                }
            }

            str += ">";
        } else {
            // Print Object
            str = "{";
            const object: { [ key: string | number | symbol ]: any} = objectOrArray;
            const names = Object.keys( object );

            for ( let i = 0 ; i < names.length ; i++ ) {
                if ( i > 0 ) {
                    str += ", ";
                }

                const name = names[ i ];
                str += describeKeyForErrorMessage( name ) + ": ";
                const value = object[ name ];
                let substr;

                if ( typeof value === "object" && value !== null ) {
                    substr = describeObjectForErrorMessage( value );
                } else {
                    substr = describeValueForErrorMessage( value );
                }

                if ( name === expandedName ) {
                    start = str.length;
                    length = substr.length;
                    str += substr;
                } else if ( substr.length < 10 && str.length + substr.length < 40 ) {
                    str += substr;
                } else {
                    str += "...";
                }
            }

            str += "}";
        }
    }

    if ( expandedName === undefined ) {
        return str;
    }

    if ( start > -1 && length > 0 ) {
        const highlight = " ".repeat( start ) + "^".repeat( length );
        return "\n  " + str + "\n  " + highlight;
    }

    return "\n  " + str;
}
