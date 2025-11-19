import React from "react";

import { LayoutGroup, motion } from "framer-motion";

import "@zenflux/react-ui/src/accordion/_ui-theme-accordion.scss";

import { ArrowDown } from "@zenflux/react-ui/src/symbols";

import {
    accordionHandleSelection,
    accordionHandleExternalSelection
} from "@zenflux/react-ui/src/accordion/ui-theme-accordion-handle-selection";

import { useMeasuredMaxHeight } from "@zenflux/react-ui/src/hooks/use-measured-max-height";

import type {
    UIThemeAccordionItemProps,
    UIThemeAccordionProps,
    UIThemeAccordionCollapseStates
} from "@zenflux/react-ui/src/accordion/ui-theme-accordion-types";

/**
 * Function UIThemeAccordionHeading()
 */
const UIThemeAccordionHeading = ( props: Omit<UIThemeAccordionItemProps, "children"> & {
    children: UIThemeAccordionItemProps[ "heading" ][ "title" ]
} ) => {
    const { children } = props,
        { icon, iconAlt } = props.heading;

    const Icon = () => ( icon &&
        <span className="accordion-icon">
            <img className="icon" src={ icon } alt={ iconAlt }/>
        </span>
    );

    /* Avoid flickering on re-render */
    const MemorizedHeading = React.useMemo( () => (
        <>
            <span className="accordion-indicator">
                { <ArrowDown/> }
            </span>

            { Icon() }

            <div className="accordion-title">
                { children }
            </div>
        </> ), [ children, icon, iconAlt ] );

    return MemorizedHeading;
};

/**
 * Function UIThemeAccordionItemCollapse() : The AccordionItemCollapse component follows a common pattern for accordion components
 * in React: maintaining a state determines the collapsed/expanded status of the accordion item.
 * The component uses the useState and useEffect React hooks to handle state and side effects respectively.
 *
 * The component uses the framer-motion library to animate the accordion's opening and closing.
 * With AnimatePresence from framer-motion, elements can be animated in and out of the React component tree.
 */
const UIThemeAccordionItemCollapse = ( props: {
    children: any,
    height: number,
    collapsedState: UIThemeAccordionCollapseStates
    collapsedStateRef: React.MutableRefObject<HTMLDivElement | null>,
    setCollapsedState: React.Dispatch<React.SetStateAction<UIThemeAccordionCollapseStates>>,
    setIsTransitioning: React.Dispatch<React.SetStateAction<boolean>>,
    unmount?: boolean,
} ): React.JSX.Element => {
    const { children, height, collapsedState, collapsedStateRef, setIsTransitioning } = props;

    const isOpen = collapsedState === "attached";

    const [ renderChildren, setRenderChildren ] = React.useState<boolean>( ! props.unmount || isOpen );

    React.useEffect( () => {
        if ( ! props.unmount ) {
            setRenderChildren( true );
            return;
        }

        if ( collapsedState === "attached" ) {
            setRenderChildren( true );
        }
    }, [ collapsedState, props.unmount ] );

    return (
        <motion.div
            className="accordion-collapse"
            style={ { overflow: "hidden" } }
            initial={ false }
            animate={ { maxHeight: isOpen ? height : 0, opacity: isOpen ? 1 : 0 } }
            transition={ { type: "spring", stiffness: 120, damping: 28 } }
            onAnimationStart={ () => setIsTransitioning( true ) }
            onAnimationComplete={ () => {
                setIsTransitioning( false );
                if ( props.unmount && ! isOpen ) {
                    setRenderChildren( false );
                }
            } }
            layout="size"
        >
            <motion.div className="accordion-content" ref={ collapsedStateRef } layout>
                { renderChildren ? children : null }
            </motion.div>
        </motion.div>
    );
};

const UIThemeAccordionItemContent = ( props: Pick<UIThemeAccordionItemProps, "children" | "collapsedState" | "setCollapsedState" | "setIsTransitioning" | "unmount"> ) => {
    const { children, collapsedState, setCollapsedState } = props;

    const collapsedStateRef = React.useRef<null | HTMLDivElement>( null );
    const height = useMeasuredMaxHeight( collapsedStateRef as React.RefObject<HTMLDivElement> );

    const args = {
        height,
        collapsedState,
        collapsedStateRef,
        setCollapsedState,
        setIsTransitioning: props.setIsTransitioning!,
        unmount: props.unmount,
    };

    return ( <UIThemeAccordionItemCollapse { ... args } >
        { children }
    </UIThemeAccordionItemCollapse> );
};

export const UIThemeAccordionItem = ( props: UIThemeAccordionItemProps ) => {
    const { children, heading, itemKey, onClick, collapsedState, setCollapsedState, setIsTransitioning, unmount } = props;

    const headingProps = { ...props, children: undefined } as UIThemeAccordionItemProps; // safe for heading-only usage

    const contentProps = {
        collapsedState,
        setCollapsedState: setCollapsedState!,
        setIsTransitioning: setIsTransitioning!,
        unmount,
    };

    return (
        <>
            <h2 className="accordion-heading">
                <button className="accordion-button" onClick={ ( e ) =>
                    onClick?.( e as any, itemKey.toString(), collapsedState )
                }>
                    <UIThemeAccordionHeading { ... headingProps }>
                        { heading.title }
                    </UIThemeAccordionHeading>
                </button>
                { heading.extra || null }
            </h2>

            <div className="accordion-content-container">
                <UIThemeAccordionItemContent { ... contentProps }>
                    { children }
                </UIThemeAccordionItemContent>
            </div>
        </>
    );
};

const NormalizeAccordionItem = ( props: any ) => {
    const { item, selected, setSelected, sharedProps, isTransitioning, setIsTransitioning } = props;

    const ref = React.createRef<HTMLDivElement>();

    let [ collapsedState, setCollapsedState ] = React.useState<UIThemeAccordionCollapseStates>( "initial" );

    collapsedState = item.props.collapsedState || collapsedState;
    setCollapsedState = item.props.setCollapsedState || setCollapsedState;

    const itemProps: Required<UIThemeAccordionItemProps> = {
        ... item.props,

        collapsedState,
        setCollapsedState,

        setIsTransitioning,
    };

    itemProps.onClick = ( e ) => {
        return accordionHandleSelection( e, ref, {
            key: itemProps.itemKey.toString(),

            collapsedState,
            setCollapsedState,

            selected,
            setSelected,

            // Passing `api` onClick handler, `accordionHandleSelection` will handle the call to it.
            onClick: props.onClick,

            isTransitioning
        }, );
    };

    sharedProps[ itemProps.itemKey.toString() ] = itemProps;

    React.useEffect( () => {
        if ( collapsedState === "initial" ) {
            setCollapsedState( "detached" );

            if ( ref.current ) {
                ref.current.setAttribute( "data-collapsed", "detached" );
            }
        }
    }, [] );

    return (
        <div className="group accordion-item" data-collapsed={ "initial" } ref={ ref }>
            { <item.type { ... itemProps }/> }
        </div>
    );
};

export const UIThemeAccordion = React.memo( ( props: UIThemeAccordionProps ) => {
    let { children } = props;

    let [ selectedInternal, setSelectedInternal ] = React.useState<{ [ key: string ]: boolean }>( {} );

    const selected = props.selected || selectedInternal,
        setSelected = props.setSelected || setSelectedInternal;

    const [ prevSelected, setPrevSelected ] = React.useState<typeof selected>( {} );

    const [ isTransitioning, setIsTransitioning ] = React.useState<boolean>( false );

    const sharedProps = React.useMemo<{ [ key: string ]: any }>( () => {
        return {};
    }, [] );

    // Remove deleted sharedProps
    Object.keys( sharedProps ).forEach( ( key ) => {
        if ( ! children.find( ( item ) => item.props.itemKey.toString() === key ) ) {
            delete sharedProps[ key ];
        }
    } );

    accordionHandleExternalSelection( {
        selected,
        setSelected,

        prevSelected,
        setPrevSelected,

        onSelectionChanged: props.onSelectionChanged!,

        sharedProps,
    } );

    return (
        <LayoutGroup>
            <div className="accordion">
                { children.map( ( item ) => {
                    return <NormalizeAccordionItem
                        key={ item.props.itemKey }
                        item={ item }
                        selected={ selected }
                        setSelected={ setSelected }
                        sharedProps={ sharedProps }
                        isTransitioning={ isTransitioning }
                        setIsTransitioning={ setIsTransitioning }
                        onClick={ props.onClick }/>;
                } ) }
            </div>
        </LayoutGroup>
    );
} );
