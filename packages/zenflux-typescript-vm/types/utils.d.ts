/**
 * Generate checksum for data.
 *
 * @param {import("node:crypto").BinaryLike} data
 *
 * @return {string}
 */
export function checksum(data: import("node:crypto").BinaryLike): string;

/**
 * Check if path a common path format.
 *
 * @param {string} path
 */
export function isCommonPathFormat(path: string): boolean;

/**
 * Ensure path is absolute, if not, resolve it from relative path.
 *
 * @param {string} path
 * @param {string} [relative=process.cwd()]
 */
export function getAbsoluteOrRelativePath(path: string, relative?: string): string;

/**
 * Create a promise that can be resolved from outside.
 */
export function createResolvablePromise(): {
    promise: Promise<any>;
    await: Promise<any>;

    isPending: boolean;
    isRejected: boolean;
    isFulfilled: boolean;

    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
};

/**
 * Function to output verbose information.
 *
 * @param {string} module
 * @param {string} method
 * @param {function} callback
 */
export function verbose(module: string, method: string, callback: Function): void;

/**
 * @param {string} directoryPath
 * @param {RegExp} filterPattern
 * @param {number} [maxAllowedDepth=Infinity]
 * @param [options] {{
 *     ignoreStartsWith: string[];
 * }}
 *
 * @return {string[]}
 */
export function getMatchingPathsRecursive(directoryPath: string, filterPattern: RegExp, maxAllowedDepth?: number, options?: {
    ignoreStartsWith: string[]
} ): string[];
