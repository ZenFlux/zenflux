/**
 * Reads and parses a TypeScript Configuration file.
 *
 * @param {string} tsConfigPath - The file path of the TypeScript Configuration file.
 * @param {(path: string) => string | undefined} [readConfigCallback]
 *
 * @throws {Error} Throws an error if there is an error reading or parsing the file.
 *
 * @returns {import("typescript").ParsedCommandLine} The parsed TypeScript Configuration object.
 */
export function readTsConfig(tsConfigPath: string, readConfigCallback?: (path: string) => string | undefined): import("typescript").ParsedCommandLine;
/**
 * Converts TypeScript compiler options to SWC compiler options
 *
 * @param {import("typescript").ParsedCommandLine} tsConfig - TypeScript parsed configuration object
 * @param {import("@swc/types").Options} inherentOptionsSwcOptions - SWC compiler options object. Default to an empty object
 *
 * @returns {import("@swc/types").Options} - The converted/customized SWC options
 */
export function convertTsConfig(tsConfig: import("typescript").ParsedCommandLine, inherentOptionsSwcOptions?: import("@swc/types").Options): import("@swc/types").Options;
/**
 * Converts TypeScript's ScriptTarget version to SWC JscTarget version.
 *
 * @param {import("typescript").ScriptTarget} target - The TypeScript ScriptTarget version.
 *
 * @returns {import("@swc/types").JscTarget} - The corresponding SWC JscTarget version.
 */
export function convertScriptTarget(target: import("typescript").ScriptTarget): import("@swc/types").JscTarget;
/**
 * Converts TypeScript CompilerOptions to SWC ModuleConfig.
 *
 * @param {import("typescript").CompilerOptions} compilerOptions - TypeScript CompilerOptions
 *
 * @returns {import("@swc/types").ModuleConfig} - The corresponding SWC ModuleConfig
 */
export function convertModuleOptions(compilerOptions: import("typescript").CompilerOptions): import("@swc/types").ModuleConfig;
