/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { Commands } from "@zenflux/core/src/managers/commands";
import { Controllers } from "@zenflux/core/src/managers/controllers";
import { Restful } from "@zenflux/core/src/managers/restful";
import { Internal } from "@zenflux/core/src/managers/internal";

import type { IAPIConfig } from "@zenflux/core/src/interfaces";

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
