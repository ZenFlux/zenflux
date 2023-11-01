/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description CommandPublic represents a USER action, every class which inherit from this class will USER action.
 * */
import { CommandBase } from "@z-core/command-bases/command-base";

export class CommandPublic extends CommandBase {
    public static getName() {
        return "ZenFlux/Core/CommandBases/CommandPublic";
    }
}

