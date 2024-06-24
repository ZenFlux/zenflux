export function zGetMatchingPathsRecursive(directoryPath: string, filterPattern: RegExp, maxAllowedDepth?: number, options?: {
    ignoreStartsWith?: string[];
}): Promise<string[]>;
export function zIsUnixOrFileProtocolPath(path: string): boolean;
export function zGetAbsoluteOrRelativePath(path: string, relative?: string): string;
