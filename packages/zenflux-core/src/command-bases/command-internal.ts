/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description CommandInternal, is used when part of the logic needed to be in the command but not represent a user action.
 */
import { CommandBase } from "@zenflux/core/src/command-bases/command-base";

export class CommandInternal extends CommandBase {
    public static getName() {
        return "ZenFlux/Core/CommandBases/CommandInternal";
    }
}
