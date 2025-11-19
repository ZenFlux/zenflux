/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { Commands } from "./commands";
import { Controllers } from "./controllers";
import { Restful } from "./restful";
import { Internal } from "./internal";

import type { IAPIConfig } from "../interfaces";

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
