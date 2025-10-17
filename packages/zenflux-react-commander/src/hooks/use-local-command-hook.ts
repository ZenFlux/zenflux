import React from "react";

import { ComponentIdContext } from "@zenflux/react-commander/commands-context";
import { useCommandHook } from "@zenflux/react-commander/hooks";

import type { DCommandArgs } from "@zenflux/react-commander/definitions";

export function useLocalCommandHook(
    commandName: string,
    handler: ( result?: unknown, args?: DCommandArgs ) => void
) {
    const ref = React.useContext(ComponentIdContext).getComponentRef();

    useCommandHook(commandName,  handler, ref);
}

