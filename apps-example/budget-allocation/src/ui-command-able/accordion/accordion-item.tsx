import React from "react";

import { withCommands } from "@zenflux/react-commander/with-commands";

import { CommandBase } from "@zenflux/react-commander/command-base";

import { useCommand } from "@zenflux/react-commander/use-commands";

import { UIThemeAccordionItem } from "@zenflux/react-ui/src/accordion/ui-theme-accordion";

import { AccordionItemMenu } from "@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item-menu";

import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

import type { UIThemeAccordionItemProps, UIThemeAccordionCollapseStates } from "@zenflux/react-ui/src/accordion/ui-theme-accordion-types";

export interface AccordionItemProps extends Omit<UIThemeAccordionItemProps, "heading" | "collapsedState" | "setCollapsedState"> {
    heading: {
        icon?: string,
        iconAlt?: string,
        title?: string | React.ReactElement,
    }
    menu: {
        [ key: string ]: {
            label: string,
            action: () => void,
            color?: "default" | "primary" | "success" | "warning" | "secondary" | "danger",
        },
    },
    onRender?: () => void,
}

const AccordionItemEditableTitle = React.forwardRef<HTMLSpanElement, Omit<AccordionItemProps, "children"> & { collapsedState?: UIThemeAccordionCollapseStates }>((props, refForParent ) => {
    const [ isEditing, setIsEditing ] = React.useState( false ),
        [ isFocusCaptured, setIsFocusCaptured ] = React.useState( false );

    const editableCommand = useCommand( "UI/AccordionItem/EditableTitle" ),
        onTitleChangedCommand = useCommand( "UI/AccordionItem/OnTitleChanged" );

    const isCollapsed = React.useMemo( () => {
        return props.collapsedState === "detached";
    }, [ props.collapsedState ] );

    const runOnTitleChangedCommand = ( newTitle: string ) => {
        onTitleChangedCommand.run( { title: newTitle, itemKey: props.itemKey } );
    };

    const ref = React.useRef<HTMLSpanElement>( null );

    // If selection detached from the element, stop editing
    React.useEffect( () => {
        if ( ! isEditing || ! ref.current || ! isCollapsed ) {
            return;
        }

        ref.current.contentEditable = "false";
    }, [ isCollapsed ] );

    // On accordion enable editing, set editing mode is on
    React.useEffect( () => {
        editableCommand.hook( ( result, args ) => {
            setIsEditing( args!.state );

            setTimeout( () => {
                if ( ref.current ) {
                    ref.current.focus();

                    // Without this, the cursor will be at the start of the text
                    let sel = window.getSelection();

                    if ( ! sel ) {
                        return;
                    }

                    sel.selectAllChildren(ref.current);
                    sel.collapseToEnd();
                }
            }, 1000 );
        } );

        return () => {
            editableCommand.unhook();
        };
    }, [ setIsEditing ] );

    // On enter, stop editing
    function onKeyPress( e: React.KeyboardEvent<HTMLSpanElement> ) {
        if ( ! isEditing ) {
            return;
        }

        if ( e.key === "Enter" ) {
            e.preventDefault();
            e.stopPropagation();

            setIsEditing( false );

            runOnTitleChangedCommand( e.currentTarget.innerText );
        }
    }

    // Start editing on click
    function onClick( e: React.MouseEvent<HTMLSpanElement, MouseEvent> ) {
        if ( ! isEditing ) {
            return;
        }

        e.stopPropagation();
        e.preventDefault();

        e.currentTarget.focus();
    }

    // On focus capture, set flag to await for release/blur.
    function onFocusCapture() {
        if ( ! isEditing ) {
            return;
        }

        setIsFocusCaptured( true );
    }

    // If focus was captured, and blur happened, stop editing
    function onBlur( e: React.FocusEvent<HTMLSpanElement> ) {
        if ( ! isEditing ) {
            return;
        }

        if ( isFocusCaptured ) {
            setIsFocusCaptured( false );
            setIsEditing( false );

            runOnTitleChangedCommand( e.currentTarget.innerText );
        }
    }

    (refForParent as any).current = ref.current;

    return <span
        className="accordion-item-title"
        ref={ ref }
        contentEditable={ isEditing }
        suppressContentEditableWarning={ true }
        onKeyPress={ onKeyPress }
        onClick={ onClick }
        onFocusCapture={ onFocusCapture }
        onBlur={ onBlur }
    >
        { props.heading?.title }
    </span>;
});

const AccordionItem: DCommandFunctionComponent<AccordionItemProps> = ( props ) => {
    const { itemKey, heading = {}, menu = {} } = props;

    const onAction = ( key: React.Key ) => {
        const action = menu[ key.toString() ]?.action;

        if ( action ) {
            action();
        }
    };

    const ref = React.useRef<HTMLSpanElement>( null ),
        onceRef = React.useRef( false );

    React.useEffect( () => {
        if ( ! ref.current || onceRef.current ) {
            return;
        }

        onceRef.current = true;

        if ( props.onRender ) {
            setTimeout( props.onRender, 800 );
        }
    }, [ ref.current ] );

    const propsInternal: any = {
        ... props,

        heading: {
            ... heading,

            title: <AccordionItemEditableTitle { ...props } ref={ref} />,

            extra:
                <span className={ "accordion-item-menu" }>
                    <AccordionItemMenu menuItems={ menu } onAction={ onAction }/>
                </span>,
        },
    };

    return <UIThemeAccordionItem { ... propsInternal } key={ itemKey }>
        { props.children }
    </UIThemeAccordionItem>;
};

const $$ = withCommands( "UI/AccordionItem", AccordionItem, [
    class Editable extends CommandBase {
        public static getName() {
            return "UI/AccordionItem/EditableTitle";
        }
    },
    class OnTitleChanged extends CommandBase {
        public static getName() {
            return "UI/AccordionItem/OnTitleChanged";
        }
    }
] );

export default $$;
