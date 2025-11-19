/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description Responsible for manging controllers, each controller is global singleton instance.
 */
import { ControllerAlreadyRegistered } from "../errors/controller-already-registered";

import { ObjectBase } from "../bases/object-base";

import type { ControllerBase } from "../bases/controller-base";

export class Controllers extends ObjectBase {
    private controllers: { [ key: string ]: ControllerBase } = {};

    public constructor() {
        super();
    }

    public static getName() {
        return "ZenFlux/Core/Managers/Controllers";
    }

    public get( name: string ) {
        return this.controllers[ name ];
    }

    public getAll() {
        return this.controllers;
    }

    public register( controller: ControllerBase ) {
        if ( this.controllers[ controller.getName() ] ) {
            throw new ControllerAlreadyRegistered( controller );
        }

        // Register.
        this.controllers[ controller.getName() ] = controller;

        return controller;
    }
}
