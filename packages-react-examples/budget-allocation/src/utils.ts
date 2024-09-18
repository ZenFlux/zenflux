export type EnforceKeys<T> = { [P in keyof Required<T>]: boolean };

export function pickEnforcedKeys<T>( source: T, keys: EnforceKeys<T> ) {
    const target: Partial<T> = {};

    if ( !source ) {
        throw new Error( "Source is empty" );
    }

    Object.keys( keys ).forEach( ( key ) => {
        if ( false === keys[ key as keyof T ] ) {
            return;
        }

        if ( "undefined" === typeof source[ key as keyof T ] ) {
            throw new Error( `Missing key: ${ key }` );
        }
        target[ key as keyof T ] = source[ key as keyof T ];
    } );

    return target as T;
}

export function formatNumericStringToFraction( value: string ) {
    const parsed = parseFloat( value.replace( /,/g, "" ) );

    return ( Number.isNaN( parsed ) ? 0 : parsed ).toLocaleString(
        undefined,
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }
    );
}

export function formatNumericStringWithCommas( value: string ) {
    if ( ! value?.length ) {
        return "0";
    }

    // If include alphabet, then halt
    if ( /[a-zA-Z]/.test( value ) ) {
        return null;
    }

    // Remove leading zeros.
    value = value.replace( /^0+/, "" );

    // Decimal separator (eg 100 /  1,000 / 10,000).
    const valueWithoutSeparators = value.replace( /,/g, "" );

    const number = parseFloat( valueWithoutSeparators );

    if ( Number.isNaN( number ) ) {
        return "0";
    }

    return number.toLocaleString();
}
