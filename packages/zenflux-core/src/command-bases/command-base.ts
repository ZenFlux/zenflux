/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description Base for all commands, they are all will be managed by the `Commands` managers.
 *
 * TODO
 *  - Add validateArgs method or find something better.
 */
import { ObjectBase } from "@z-core/bases";
import { ControllerAlreadySet, ForceMethodImplementation } from "@z-core/errors";

import type { ControllerBase} from "@z-core/bases";

import type { ICommandArgsInterface, ICommandOptionsInterface, ILogger } from "@z-core/interfaces";

export abstract class CommandBase extends ObjectBase {
    private static controller: ControllerBase;

    protected args: ICommandArgsInterface = {};
    protected options: ICommandOptionsInterface = {};

    private readonly logger: ILogger;

    public static getName() {
        return "ZenFlux/Core/CommandBases/CommandBase";
    }

    public static setController( controller: ControllerBase ) {
        if ( this.controller ) {
            throw new ControllerAlreadySet( this.controller );
        }

        this.controller = controller;
    }

    public static getController() {
        return this.controller;
    }

    public constructor( args: ICommandArgsInterface = {}, options = {} ) {
        super();

        const type = ( this.constructor as typeof CommandBase );

        this.logger = new ZenCore.classes.Logger( type, {
            // Happens or occurs many times, often in a similar or identical manner.
            repeatedly: true,
        } );

        this.logger.startsWith( this.constructor, { args, options } );

        this.initialize( args, options );
    }

    protected initialize( args: ICommandArgsInterface, options: ICommandOptionsInterface ) {
        this.args = args;
        this.options = options;
    }

    /**
     * TODO: Maybe abstract, currently not sure about parameters initialization.
     */
    protected apply( args = this.args, options = this.options ): any {// eslint-disable-line @typescript-eslint/no-unused-vars
        throw new ForceMethodImplementation( this, "apply" );
    }

    protected onBeforeApply?():void;
    protected onAfterApply?():void;

    public async run() {
        return this.runInternal();
    }

    private async runInternal() {
        this.onBeforeApply && this.onBeforeApply();

        const result = await this.apply( this.args, this.options );

        this.onAfterApply && this.onAfterApply();

        return result;
    }
}
