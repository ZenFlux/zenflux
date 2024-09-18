import React from "react";

import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";

import { ThreeDots } from "@zenflux/react-ui/src/symbols";

import "@zenflux/app-budget-allocation/src/ui-command-able/accordion/_accordion-item-menu.scss";

import type { AccordionItemProps } from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item";

const AccordionDropdownTrigger: React.FC<{
    onPointerUp: ( e: React.PointerEvent<Element> ) => void,
    onMouseEnter: () => void,
    onMouseLeave: () => void
}> = ( { onPointerUp, onMouseEnter, onMouseLeave } ) => (
        <DropdownTrigger
                onPointerUp={ onPointerUp }
                onMouseEnter={ onMouseEnter }
                onMouseLeave={ onMouseLeave }
        >
            <span>
                <ThreeDots className="menu-trigger"/>
            </span>
        </DropdownTrigger>
);

const AccordionDropdownMenu: React.FC<{
    onMouseEnter: () => void,
    onMouseLeave: () => void,
    onAction: ( key: React.Key ) => void,
    menuItems: NonNullable<AccordionItemProps[ "menu" ]>
}> = ( { onMouseEnter, onMouseLeave, onAction, menuItems } ) => {
    return (
            <DropdownMenu
                    onMouseEnter={ onMouseEnter }
                    onMouseLeave={ onMouseLeave }
                    onAction={ onAction }
                    aria-label={ "accordion-item-menu" }
            >
                { Object.entries( menuItems ).map( ( [ key, { label, color } ] ) => (
                        <DropdownItem
                                key={ key }
                                color={ color ?? "default" }
                                className={ color ? "text-${color}" : "" }
                                ria-label={ "accordion-item-menu-dropdown" }
                                onPointerUp={ onMouseLeave }
                        >
                            { label }
                        </DropdownItem>
                ) ) }
            </DropdownMenu>
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

    const handleMouseEnter = ( force?: boolean) => {
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
            <Dropdown isOpen={ isOpen }>
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
            </Dropdown>
    );
}
