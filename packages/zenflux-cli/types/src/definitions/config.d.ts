/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import type { IConfigFile as IAPIExtractorConfigFile } from "@microsoft/api-extractor";
import type { TZFormatType } from ".//src/definitions/zenflux";
import type { TForceEnumKeys } from ".//src/utils/common";
interface IConfigRequiredArgs {
    inputPath: string;
    outputFileName: string;
}
interface IConfigOptionalArgs {
    format?: TZFormatType[];
    extensions?: string[];
    external?: string[] | RegExp[];
    globals?: {
        [key: string]: string;
    };
}
interface IIConfigArgsGeneralBase {
    enableCustomLoader?: boolean;
    enableCjsAsyncWrap?: boolean;
    omitWarningCodes?: string[];
    inputDtsPath?: string;
    outputDtsPath?: string;
    importsDtsReplace?: [string, string];
    onBuiltFormat?: (format: TZFormatType | undefined) => void;
    onBuilt?: () => void;
    apiExtractor?: Partial<IAPIExtractorConfigFile>;
}
interface IIConfigArgsGeneralBasic extends IIConfigArgsGeneralBase {
    enableCustomLoader?: false;
    moduleForwarding?: never;
}
interface IConfigArgsGeneralWithCustomLoader extends IIConfigArgsGeneralBase {
    enableCustomLoader: true;
    /**
     * This property is an object that maps module names to their respective paths.
     * It is used to redirect module imports to different locations, which can be useful in a monorepo setup.
     *
     * The keys of the object represent the module names that you want to redirect.
     * The values are another object that maps the source module path to the target module path.
     *
     * For example:
     *
     *    moduleForwarding: {
     *         "@zenflux/react-reconciler": {
     *             "@zenflux/react-scheduler": "@zenflux/react-scheduler/mock",
     *         },
     *         "@zenflux/react-noop-renderer": {
     *             "@zenflux/react-scheduler": "@zenflux/react-scheduler/mock",
     *         }
     *     }
     *
     * In the above example, whenever the `@zenflux/react-reconciler` imports `@zenflux/react-scheduler`,
     * it will be redirected to `@zenflux/react-scheduler/mock`.
     * The same goes for `@zenflux/react-noop-renderer`.
     *
     * TODO: For while `moduleForwarding` will applies for all formats
     */
    moduleForwarding?: {
        [forModule: string]: {
            [source: string]: string;
        };
    };
}
type IConfigArgsGeneral = IIConfigArgsGeneralBasic | IConfigArgsGeneralWithCustomLoader;
interface IConfigArgsForEachFormat extends IConfigRequiredArgs, IConfigOptionalArgs {
}
export type IConfigArgsBase = IConfigOptionalArgs & IConfigArgsGeneral;
export type TConfigType = "single" | "multi" | "unknown";
/**
 * @public
 */
export type IZConfig = IConfigArgsForEachFormat & IConfigArgsGeneral & {
    outputName: string;
};
/**
 * @public
 */
export type IZConfigInMulti = IConfigArgsForEachFormat & IConfigArgsGeneral;
/**
 * @public
 */
export interface IZConfigs {
    /**
     * Every config object will inherit from this object.
     */
    $defaults?: IConfigArgsBase;
    [key: string]: IZConfigInMulti | IConfigArgsBase | undefined;
}
/**
 * @internal
 */
export type IZConfigInternal = IZConfig & {
    type: TConfigType;
    path: string;
    format: TZFormatType[];
    outputName: string;
};
/**
 * @internal
 */
export interface IZConfigArgsRequiredInternal {
    extensions: string[];
}
/**
 * Represents a single configuration object for each format.
 *
 * @internal
 */
export type TZConfigInternalArgs = Omit<IZConfigInternal, "format"> & Required<IZConfigArgsRequiredInternal> & {
    format: TZFormatType;
};
/**
 * @internal
 */
export declare const Z_CONFIG_DEFAULTS: IZConfigArgsRequiredInternal;
/**
 * @internal
 */
export declare const Z_CONFIG_REQUIRED: TForceEnumKeys<IConfigRequiredArgs>;
export declare const Z_CONFIG_REQUIRED_KEYS: (keyof IConfigRequiredArgs)[];
export {};
//# sourceMappingURL=config.d.ts.map