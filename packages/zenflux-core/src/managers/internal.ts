/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 * @description Responsible for manging internal commands, To serve commands that are not triggered by user.
 */
import { Commands } from "@zenflux/core/src/managers/commands";

export class Internal extends Commands {
    public static getName() {
        return "ZenFlux/Core/Managers/Internal";
    }
}
