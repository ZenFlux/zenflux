/**
 * Finds the path of the root package.json file in a workspace.
 * @param {Object} options - The options for finding the root package.json path.
 * @param {boolean} [options.silent=false] - If true, suppresses the error if root package.json is not found.
 * @param {boolean} [options.useCache=true] - If true, caches the result to improve performance.
 * @return {string} - The path of the root package.json file, or an empty string if not found (if silent is true).
 * @throws {Error} - Throws an error if root package.json is not found (if silent is false).
 */
export function zFindRootPackageJsonPath(options?: {
    silent?: boolean;
    useCache?: boolean;
}): string;
