/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "node:process";
import path from "node:path";
import util from "node:util";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { zGlobalInitPaths } from "@zenflux/cli/src/core/global";
import { zWorkspaceFindRootPackageJsonPath, zWorkspaceGetRootPackageName } from "@zenflux/cli/src/core/workspace";

export abstract class CommandBase {
    declare protected paths: ReturnType<typeof zGlobalInitPaths>;

    protected initPathsArgs = {
        cwd: process.cwd(),
        workspaceName: zWorkspaceGetRootPackageName( { silent: true } ),
        workspacePath: path.dirname( zWorkspaceFindRootPackageJsonPath( { silent: true } ) ),
    } as Parameters<typeof zGlobalInitPaths>[ 0 ];

    public constructor( protected args: string[], protected options: any = {} ) {
        options.name = options.name ?? this.constructor.name;

        if ( args.includes( "--help" ) ) {
            this.showHelp( options.name );
            return;
        }

        this.initialize?.();

        // TODO: Does it even needed to save paths here?
        this.paths = zGlobalInitPaths( this.initPathsArgs );
    }

    protected initialize?(): void;

    protected abstract run(): Promise<void>;

    protected showHelp( name = this.options.name, optionsText = "options" ): void {
        ConsoleManager.$.log( `Usage: ${ util.inspect( name ) } ${ optionsText }:` );
    };
}
