/* eslint-disable no-restricted-imports, @zenflux/no-relative-imports */
import React from "react";

import { useCommandHook } from "./use-command/use-command-hook";

import { ComponentIdContext } from "../commands-context";

import type { DCommandArgs } from "../definitions";

export function useLocalCommandHook(
    commandName: string,
    handler: ( result?: unknown, args?: DCommandArgs ) => void
) {
    const ref = React.useContext(ComponentIdContext).getComponentRef();

    useCommandHook(commandName,  handler, ref);
}

