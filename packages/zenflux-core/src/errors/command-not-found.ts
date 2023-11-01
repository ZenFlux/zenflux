/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */

/**
 * @internal
 */
export class CommandNotFound extends Error {
    public constructor( command: string ) {
        super( `Command: '${ command }' is not found` );
    }
}
