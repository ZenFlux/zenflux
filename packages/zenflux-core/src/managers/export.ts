/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { Commands } from "@z-core/managers/commands";
import { Controllers } from "@z-core/managers/controllers";
import { Restful } from "@z-core/managers/restful";
import { Internal } from "@z-core/managers/internal";

import type { IAPIConfig } from "@z-core/interfaces";

export const afterInitializeCallbacks: ( () => void )[] = [];

export function initialize( config: IAPIConfig ) {
    commands = new Commands();
    controllers = new Controllers();
    restful = new Restful( config );
    internal = new Internal();
}

export function destroy() {
    commands = {} as Commands;
    controllers = {} as Controllers;
    restful = {} as Restful;
    internal = {} as Internal;
}

export let commands = {} as Commands;
export let controllers = {} as Controllers;
export let restful = {} as Restful;
export let internal = {} as Internal;
