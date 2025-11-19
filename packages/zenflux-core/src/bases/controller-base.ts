/**
 * The `ControllerBase` class is an abstract base class responsible for managing commands and providing a structure
 * for controllers or command spaces.
 *
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { ObjectBase } from "./object-base";

import * as managers from "../managers/export";

import type { CommandPublic } from "../command-bases/command-public";
import type { CommandRestful } from "../command-bases/command-restful";
import type { CommandInternal } from "../command-bases/command-internal";

// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected

export abstract class ControllerBase extends ObjectBase {
    private commands: { [ key: string ]: typeof CommandPublic };
    private restful: { [ key: string ]: typeof CommandRestful };
    private internal: { [ key: string ]: typeof CommandInternal };

    public static getName() {
        return "ZenFlux/Core/ControllerBase";
    }

    /**
     * Constructor for `ControllerBase` instances.
     * Initializes the base class and invokes the `initialize()` method.
     */
    public constructor() {
        super();

        // Initialize the controller
        this.initialize();
    }

    /**
     * Initializes the controller by calling the `register()` method and optionally the `setupHooks()` method.
     */
    protected initialize() {
        // Register commands and command types
        this.register();

        // Optionally, set up hooks if the `setupHooks()` method is defined in derived classes
        this.setupHooks && this.setupHooks();
    }

    /**
     * Registers commands and command types by calling manager functions.
     */
    protected register() {
        // Register public commands
        this.commands = managers.commands.register( this.getCommands(), this ) as {
            [ key: string ]: typeof CommandPublic
        };

        // Register RESTful commands
        this.restful = managers.restful.register( this.getRestful(), this ) as {
            [ key: string ]: typeof CommandRestful
        };

        // Register internal commands
        this.internal = managers.internal.register( this.getInternal(), this ) as {
            [ key: string ]: typeof CommandInternal
        };
    }

    /**
     * Retrieve the public commands associated with this controller.
     * Derived classes can override this method to specify their own commands.
     */
    protected getCommands(): { [ key: string ]: typeof CommandPublic } {
        return {};
    }

    /**
     * Retrieve the RESTful commands associated with this controller.
     * Derived classes can override this method to specify their own RESTful commands.
     */
    protected getRestful(): { [ key: string ]: typeof CommandRestful } {
        return {};
    }

    /**
     * Retrieve the internal commands associated with this controller.
     * Derived classes can override this method to specify their own internal commands.
     */
    protected getInternal(): { [ key: string ]: typeof CommandInternal } {
        return {};
    }

    /**
     * A hook method that can be optionally overridden in derived classes to set up hooks or event listeners.
     */
    protected setupHooks?() {}
}
