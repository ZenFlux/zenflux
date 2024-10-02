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
export function zIsObject(item: any): boolean;
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
export function zDeepMerge<T>(target: T, source: T, mergedObjects?: Set<any>): T;
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
export function zDeepMergeAll<T>(...objects: T[]): T;
