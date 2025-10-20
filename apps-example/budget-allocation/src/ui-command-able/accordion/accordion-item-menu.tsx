import React from "react";

import { ThreeDots } from "@zenflux/react-ui/src/symbols";

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@zenflux/app-budget-allocation/src/components/ui/dropdown-menu";

import "@zenflux/app-budget-allocation/src/ui-command-able/accordion/_accordion-item-menu.scss";

import type { AccordionItemProps } from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item";

const AccordionDropdownTrigger: React.FC<{
    onPointerUp: ( e: React.PointerEvent<Element> ) => void,
    onMouseEnter: () => void,
    onMouseLeave: () => void
}> = ( { onPointerUp, onMouseEnter, onMouseLeave } ) => (
    <DropdownMenuTrigger
        onPointerUp={ onPointerUp }
        onMouseEnter={ onMouseEnter }
        onMouseLeave={ onMouseLeave }
    >
        <span>
            <ThreeDots className="menu-trigger"/>
        </span>
    </DropdownMenuTrigger>
);

const AccordionDropdownMenu: React.FC<{
    onMouseEnter: () => void,
    onMouseLeave: () => void,
    onAction: ( key: React.Key ) => void,
    menuItems: NonNullable<AccordionItemProps[ "menu" ]>
}> = ( { onMouseEnter, onMouseLeave, onAction, menuItems } ) => {
    return (
        <DropdownMenuContent
            onMouseEnter={ onMouseEnter }
            onMouseLeave={ onMouseLeave }
            aria-label={ "accordion-item-menu" }
        >
            { Object.entries( menuItems ).map( ( [ key, { label, color } ] ) => (
                <DropdownMenuItem
                    key={ key }
                    className={ color ? `text-${ color }` : "" }
                    onSelect={ () => onAction( key ) }
                >
                    { label }
                </DropdownMenuItem>
            ) ) }
        </DropdownMenuContent>
    );
};

/**
 * Using this trick to create nice dropdown menu with real popover, actually
 * this can be a general ui, not accordion related, im not sure if it works - there is no reason to do it now.
 */
export function AccordionItemMenu( args: {
    menuItems: NonNullable<AccordionItemProps[ "menu" ]>,
    onAction: ( key: React.Key ) => void
} ) {
    const { menuItems, onAction } = args;

    const [ isOpen, setIsOpen ] = React.useState( false );

    let timer: NodeJS.Timeout;

    React.useEffect( () => {
        return () => {
            clearTimeout( timer );
        };
    }, [] );

    const handleMouseLeave = () => {
        timer = setTimeout( () => setIsOpen( false ), 200 );
    };

    const handleMouseEnter = ( force?: boolean ) => {
        clearTimeout( timer );

        if ( force ) {
            return setIsOpen( true );
        }

        setTimeout( () => setIsOpen( true ), 100 );
    };

    const handlePointerUp = ( e: React.PointerEvent<Element> ) => {
        e.stopPropagation();

        clearTimeout( timer );

        // Re pop.
        setIsOpen( false );

        handleMouseEnter();
    };

    return (
        <DropdownMenu open={ isOpen } onOpenChange={ setIsOpen }>
            <AccordionDropdownTrigger
                onPointerUp={ handlePointerUp }
                onMouseEnter={ handleMouseEnter }
                onMouseLeave={ handleMouseLeave }
            />
            <AccordionDropdownMenu
                onMouseEnter={ () => handleMouseEnter( true ) }
                onMouseLeave={ () => setIsOpen( false ) }
                onAction={ onAction }
                menuItems={ menuItems }
            />
        </DropdownMenu>
    );
}
