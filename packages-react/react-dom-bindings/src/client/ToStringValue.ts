import { checkFormFieldValueStringCoercion } from "@zenflux/react-shared/src/check-string-coercion";

export type ToStringValue = boolean | number | Record<string, any> | string | null | void;

// Flow does not allow string concatenation of most non-string types. To work
// around this limitation, we use an opaque type that can only be obtained by
// passing the value through getToStringValue first.
export function toString( value: ToStringValue ): string {
    // The coercion safety check is performed in getToStringValue().
    return "" + ( value as any );
}

export function getToStringValue( value: unknown ): ToStringValue {
    switch ( typeof value ) {
        case "boolean":
        case "number":
        case "string":
        case "undefined":
            return value;

        case "object":
            if ( __DEV__ ) {
                checkFormFieldValueStringCoercion( value );
            }

            return value;

        default:
            // function, symbol are assigned as empty strings
            return "";
    }
}
