import { CommandBase } from "@zenflux/core/src/command-bases/command-base";

export class __CommandBase__Public__ extends CommandBase {
    public initialize( args: any, options: any ) {
        super.initialize( args, options );
    }

    public getArgs() {
        return this.args;
    }

    public getOptions() {
        return this.options;
    }
}
