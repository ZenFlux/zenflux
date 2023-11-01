/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import type { ControllerBase } from "@z-core/bases";

/**
 * @internal
 */
export class ControllerAlreadyRegistered extends Error {
    public constructor( controller: ControllerBase ) {
        super( `Controller: '${ controller.getName() }' is already registered` );
    }
}
