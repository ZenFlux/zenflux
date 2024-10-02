/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */

/**
 * Function `zIsObject` - Checks whether the provided item is an object.
 *
 * @param {any} item - The item to check.
 *
 * @return {boolean} True if the item is an object and not an array, otherwise false.
 */
export function zIsObject( item ) {
    return item && typeof item === 'object' && ! Array.isArray( item );
}

/**
 * Function `zDeepMerge()` - Deeply merges two objects. Combines properties from the source object into
 * the target object. Arrays are merged by concatenation and removing duplicates.
 * Non-object and non-array properties are overwritten by source's values.
 *
 * @template T
 *
 * @param {T} target - The target object to merge into.
 * @param {T} source - The source object providing properties to merge.
 * @param {Set<Object>} [mergedObjects] - Set to track merged objects to avoid circular references.
 *
 * @return {T} - The resulting object from the deep merge.
 */
export function zDeepMerge( target, source, mergedObjects = new Set() ) {
    if ( ! zIsObject( target ) ) {
        target = {};
    }

    if ( ! zIsObject( source ) ) {
        return target;
    }

    // To avoid circular references
    if ( mergedObjects.has( source ) ) {
        return target;
    }
    mergedObjects.add( source );

    Object.keys( source ).forEach( key => {
        const sourceValue = source[ key ];
        const targetValue = target[ key ];

        if ( Array.isArray( sourceValue ) ) {
            target[ key ] = Array.isArray( targetValue )
                ? Array.from( new Set( [ ...targetValue, ...sourceValue ] ) )
                : sourceValue;
        } else if ( zIsObject( sourceValue ) ) {
            target[ key ] = zDeepMerge( targetValue, sourceValue, mergedObjects );
        } else {
            target[ key ] = sourceValue;
        }
    } );

    return target;
}

/**
 * Function `zDeepMergeAll` - Deep merge multiple objects
 * This function takes multiple objects as arguments and merges them into a single
 * object by repeatedly applying the `deepMerge` function. It iterates over all
 * provided objects and merges them in sequence, resulting in a single combined object.
 *
 * @template T
 *
 * @param {...T} objects - The source object providing properties to merge.
 *
 * @return {T} - The resulting object from the deep merge.
 */
export function zDeepMergeAll( ...objects ) {
    return objects.reduce( ( acc, obj ) => zDeepMerge( acc, obj ), {} );
}
