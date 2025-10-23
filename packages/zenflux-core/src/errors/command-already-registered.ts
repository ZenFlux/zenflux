/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import type { CommandBase } from "@zenflux/core/src/command-bases/command-base";

/**
 * @internal
 */
export class CommandAlreadyRegistered extends Error {
    public constructor( command: typeof CommandBase ) {
        super( `Command: '${ command.getName() }' is already registered` );
    }
}
