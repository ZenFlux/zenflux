/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/CheckStringCoercion.js
 */

/*
 * The `'' + value` pattern (used in perf-sensitive code) throws for Symbol
 * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
 *
 * The functions in this module will throw an easier-to-understand,
 * easier-to-debug exception with a clear errors message explaining the
 * problem. (Instead of a confusing exception thrown inside the implementation
 * of the `value` object).
 */

function typeName( value: any ): string | void {
    if ( __DEV__ ) {
        // toStringTag is needed for namespaced types like Temporal.Instant
        const hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;

        return hasToStringTag && [ Symbol.toStringTag ] || ( value as any ).constructor.name || "Object";
    }
}

function willCoercionThrow( value: any ) {
    if ( __DEV__ ) {
        try {
            testStringCoercion( value );
        } catch ( e ) {
            return true;
        }
    }

    return false;
}

function testStringCoercion( value: unknown ) {
    // If you ended up here by following an exception call stack, here's what's
    // happened: you supplied an object or symbol value to React (as a prop, key,
    // DOM attribute, CSS property, string ref, etc.) and when React tried to
    // coerce it to a string using `'' + value`, an exception was thrown.
    //
    // The most common types that will cause this exception are `Symbol` instances
    // and Temporal objects like `Temporal.Instant`. But any object that has a
    // `valueOf` or `[Symbol.toPrimitive]` method that throws will also cause this
    // exception. (Library authors do this to prevent users from using built-in
    // numeric operators like `+` or comparison operators like `>=` because custom
    // methods are needed to perform accurate arithmetic or comparison.)
    //
    // To fix the problem, coerce this object or symbol value to a string before
    // passing it to React. The most reliable way is usually `String(value)`.
    //
    // To find which value is throwing, check the browser or debugger console.
    // Before this exception was thrown, there should be `console.error` output
    // that shows the type (Symbol, Temporal.PlainDate, etc.) that caused the
    // problem and how that type was used: key, atrribute, input value prop, etc.
    // In most cases, this console output also shows the component and its
    // ancestor components where the exception happened.
    //
    // not-used:eslint-disable-next-line react-internal/safe-string-coercion
    return "" + ( value as any );
}

export function checkAttributeStringCoercion( value: unknown, attributeName: string ): void | string {
    if ( __DEV__ ) {
        if ( willCoercionThrow( value ) ) {
            console.error( "The provided `%s` attribute is an unsupported type %s." + " This value must be coerced to a string before using it here.", attributeName, typeName( value ) );
            return testStringCoercion( value ); // throw (to help callers find troubleshooting comments)
        }
    }
}

export function checkKeyStringCoercion( value: unknown ): void | string {
    if ( __DEV__ ) {
        if ( willCoercionThrow( value ) ) {
            console.error( "The provided key is an unsupported type %s." + " This value must be coerced to a string before using it here.", typeName( value ) );
            return testStringCoercion( value ); // throw (to help callers find troubleshooting comments)
        }
    }
}

export function checkPropStringCoercion( value: unknown, propName: string ): void | string {
    if ( __DEV__ ) {
        if ( willCoercionThrow( value ) ) {
            console.error( "The provided `%s` prop is an unsupported type %s." + " This value must be coerced to a string before using it here.", propName, typeName( value ) );
            return testStringCoercion( value ); // throw (to help callers find troubleshooting comments)
        }
    }
}

export function checkCSSPropertyStringCoercion( value: unknown, propName: string ): void | string {
    if ( __DEV__ ) {
        if ( willCoercionThrow( value ) ) {
            console.error( "The provided `%s` CSS property is an unsupported type %s." + " This value must be coerced to a string before using it here.", propName, typeName( value ) );
            return testStringCoercion( value ); // throw (to help callers find troubleshooting comments)
        }
    }
}

export function checkHtmlStringCoercion( value: unknown ): void | string {
    if ( __DEV__ ) {
        if ( willCoercionThrow( value ) ) {
            console.error( "The provided HTML markup uses a value of unsupported type %s." + " This value must be coerced to a string before using it here.", typeName( value ) );
            return testStringCoercion( value ); // throw (to help callers find troubleshooting comments)
        }
    }
}

export function checkFormFieldValueStringCoercion( value: unknown ): void | string {
    if ( __DEV__ ) {
        if ( willCoercionThrow( value ) ) {
            console.error( "Form field values (value, checked, defaultValue, or defaultChecked props)" + " must be strings, not %s." + " This value must be coerced to a string before using it here.", typeName( value ) );
            return testStringCoercion( value ); // throw (to help callers find troubleshooting comments)
        }
    }
}
