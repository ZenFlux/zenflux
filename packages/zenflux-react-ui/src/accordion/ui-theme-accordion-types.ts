import type React from "react";

import type { UIThemeAccordionItem } from "@zenflux/react-ui/src/accordion/ui-theme-accordion.tsx";

/**
 * Type for the possible states of the Accordion collapse
 */
export type UIThemeAccordionCollapseStates = "initial" | "detached" | "attached" | "re-render";

/**
 * Type for the properties of the `ui/accordion` component
 */
export type UIThemeAccordionItemProps = {
    itemKey: React.Key,

    unmount?: boolean,

    children: React.ReactNode,

    heading: {
        title: string,
        icon?: HTMLImageElement[ "src" ],
        iconAlt?: string,
        extra?: React.ReactNode,
    }

    onClick?: ( event: React.MouseEvent<HTMLButtonElement>, key: string, state: UIThemeAccordionCollapseStates, signal?: AbortController ) => void,

    // Per item state
    collapsedState: UIThemeAccordionCollapseStates,
    setCollapsedState: React.Dispatch<React.SetStateAction<UIThemeAccordionCollapseStates>>,

    // Global state
    // `selected` is a map of the selected items, that sets the selected items, controlled (to way binding) `selected` is read/write
    // using `setSelected` and `selected` props.
    selected?: {
        [ key: string ]: boolean
    },

    setSelected?: React.Dispatch<React.SetStateAction<{
        [ key: string ]: boolean
    }>>,

    setIsTransitioning?: React.Dispatch<React.SetStateAction<boolean>>,
};

/**
 * Type for the properties of the `ui/accordion/item` component
 */
export type UIThemeAccordionProps = {
    children: React.ReactComponentElement<typeof UIThemeAccordionItem>[]

    selected?: UIThemeAccordionItemProps[ "selected" ],
    setSelected?: UIThemeAccordionItemProps[ "setSelected" ],

    // `onClick` api can only abort the click event, not trigger it.
    onClick?: ( event: React.MouseEvent<HTMLButtonElement>, key: string, state: UIThemeAccordionCollapseStates, signal?: AbortController ) => void,

    onSelectionChanged?: () => void,
}
