/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";
import type { TForceEnumKeys } from "@zenflux/cli/src/utils/common";

interface IConfigRequiredArgs {
    inputPath: string,
    outputFileName: string,
}

interface IConfigOptionalArgs {
    format?: TZFormatType[],
    extensions?: string[],

    external?: string[] | RegExp[],
    globals?: {
        [ key: string ]: string
    },
};

// Here are properties that are not format dependent
interface IConfigArgsGeneral {
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
        [ forModule: string ]: {
            [ source: string ]: string
        };
    }

    // Dts probably built once, since it's not format dependent
    inputDtsPath?: string;
    outputDtsPath?: string;

    onBuiltFormat?: ( format: TZFormatType | undefined ) => void;
    onBuilt?: () => void;
}

interface IConfigArgsForEachFormat extends IConfigRequiredArgs, IConfigOptionalArgs {
};

export interface IConfigArgsBase extends IConfigOptionalArgs, IConfigArgsGeneral {
};

export type TConfigType = "single" | "multi" | "unknown";

/**
 * @public
 */
export interface IZConfig extends IConfigArgsForEachFormat, IConfigArgsGeneral {
    outputName: string,
};

/**
 * @public
 */
export interface IZConfigInMulti extends IConfigArgsForEachFormat, IConfigArgsGeneral {
};

/**
 * @public
 */
export interface IZConfigs {
    /**
     * Every config object will inherit from this object.
     */
    $defaults?: IConfigArgsBase,

    // TODO: add $overrides
    // TODO: add $rollupOverrides

    [ key: string ]: IZConfigInMulti | IConfigArgsBase | undefined,
};

/**
 * @internal
 */
export interface IZConfigInternal extends IZConfig {
    type: TConfigType,

    // Path of self.
    path: string;

    // Required in internal use.
    format: TZFormatType[],

    // In multi config file it represent as key.
    outputName: string,
}

/**
 * @internal
 */
export interface IZConfigArgsRequiredInternal {
    extensions: string[],
}

/**
 * Represents a single configuration object for each format.
 *
 * @internal
 */
export type TZConfigInternalArgs = Omit<IZConfigInternal, "format"> &
    Required<IZConfigArgsRequiredInternal> & {
    format: TZFormatType;
}

/**
 * @internal$
 */
export const Z_CONFIG_DEFAULTS: IZConfigArgsRequiredInternal = {
    extensions: [ ".ts", ".js" ],
};

/**
 * @internal
 */
export const Z_CONFIG_REQUIRED_KEYS = Object.keys({
    inputPath: true,
    outputFileName: true,
} as TForceEnumKeys<IConfigRequiredArgs> );
