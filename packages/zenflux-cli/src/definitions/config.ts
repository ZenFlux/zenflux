/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import type { TZFormatType } from "@z-cli/definitions/zenflux";

// The arguments are precisely the only things that are used in `zRollupGetConfig`
// `zRollupGetConfig` runs for each format in the `ZConfig`, those are representing the arguments for each format.
// Why? Since `zRollupGetConfig` can be called programmatically.
export interface IConfigArgs {
    extensions: string[],
    external?: string[] | RegExp[],
    format: TZFormatType
    globals?: { [ key: string ]: string },
    inputPath: string,
    outputFileName: string,
    outputName: string,
}

// Represents `zenflux.config.ts` file, extends `IConfigArgs` with additional properties.
export interface IZConfig extends Omit<IConfigArgs, "format"> {
    format: TZFormatType [];

    inputDtsPath?: string;
    outputDtsPath?: string;

    onBuiltFormat?: ( format: TZFormatType | undefined ) => void;
    onBuilt?: () => void;

    /**
     * @internal
     */
    readonly path: string;
}
