import React from "react";

import type {
    UIThemeAccordionCollapseStates,
    UIThemeAccordionItemProps,
    UIThemeAccordionProps
} from "@zenflux/react-ui/src/accordion/ui-theme-accordion-types.ts";

/**
 * Function accordionHandleSelection() Handles the selection of an accordion item.
 */
export const accordionHandleSelection = (
    event: React.MouseEvent<HTMLButtonElement>,
    ref: React.RefObject<HTMLDivElement | null>,
    args: {
        key: string,
        collapsedState: UIThemeAccordionCollapseStates,
        setCollapsedState: React.Dispatch<React.SetStateAction<UIThemeAccordionCollapseStates>>,
        selected: UIThemeAccordionItemProps["selected"],
        setSelected: NonNullable<UIThemeAccordionItemProps["setSelected"]>,
        onClick: UIThemeAccordionItemProps["onClick"],
        isTransitioning: boolean,
    }
) => {
    // TODO: Add block on transition if needed.
    if ( ! ref.current /*|| args.isTransitioning */ ) {
        return;
    }

    const target = ref.current;

    const { onClick, collapsedState, setCollapsedState, selected, setSelected } = args;

    let state = collapsedState === "detached" ? "attached" : "detached" as UIThemeAccordionCollapseStates;

    const controller = new AbortController();

    if ( ! args.key ) {
        throw new Error( "Accordion item key is not defined" );
    }

    onClick?.( event, args.key, state, controller );

    if ( controller.signal.aborted ) {
        return;
    }

    /**
     * Trigger accordion item selection
     */
    setCollapsedState( state );

    // Update for external
    setSelected( {
        ... selected,
        [ args.key ]: state === "attached"
    } );

    target.setAttribute( "data-collapsed", state );
};

/**
 * Function accordionHandleExternalSelection() Since state can be created outside the component, it is necessary to implement a some sort of
 * solution.
 */
export const accordionHandleExternalSelection = ( args: {
    selected: NonNullable<UIThemeAccordionItemProps["selected"]>,
    setSelected: NonNullable<UIThemeAccordionItemProps["setSelected"]>,

    prevSelected: NonNullable<UIThemeAccordionItemProps["selected"]>,
    setPrevSelected: NonNullable<UIThemeAccordionItemProps["setSelected"]>,

    onSelectionChanged: NonNullable<UIThemeAccordionProps["onSelectionChanged"]>,

    sharedProps: { [ key: string ]: UIThemeAccordionItemProps },
} ) => {
    const isSelectionChanged = React.useMemo( () => {
        // Convert to array and compare
        return JSON.stringify( Object.keys( args.prevSelected ) ) !== JSON.stringify( Object.keys( args.selected ) );
    }, [ args.selected ] );

    React.useEffect( () => {
        if ( args.onSelectionChanged ) {
            setTimeout( () => {
                args.onSelectionChanged!();
            } );
        }

        if ( isSelectionChanged ) {
            // If all cleared, then clear all
            if ( Object.keys( args.selected ).length === 0 ) {
                Object.values( args.sharedProps ).forEach( ( props ) => {
                    // If attached, then detach
                    props.setCollapsedState( props.collapsedState === "attached" ? "detached" : "attached" );
                } );
            }

            // Update all items according to their selection state
            Object.values( args.sharedProps ).forEach( ( props ) => {
                const key = props.itemKey as string;

                // If attached, then detach
                props.setCollapsedState( args.selected[ key ] ? "attached" : "detached" );
            } );
        }

        args.setPrevSelected( args.selected );
    }, [ args.selected ] );
};
