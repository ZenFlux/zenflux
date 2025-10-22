import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva  } from "class-variance-authority";

import { withCommands } from "@zenflux/react-commander/with-commands";

import { CommandBase } from "@zenflux/react-commander/command-base";

import { useChildCommandHook, useCommand, useComponent } from "@zenflux/react-commander/hooks";

import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

import type { VariantProps } from "class-variance-authority";

const tabsVariants = cva(
    // Base shadcn tabs styles
    "w-full",
    {
        variants: {
            variant: {
                default: "",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const tabsListVariants = cva(
    // Base shadcn tabs list styles
    "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
    {
        variants: {
            variant: {
                default: "bg-muted p-1 text-muted-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const tabsTriggerVariants = cva(
    // Base shadcn tabs trigger styles
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
    {
        variants: {
            variant: {
                default: "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface TabsProps extends Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, "onSelectionChange" | "selectedKey">, VariantProps<typeof tabsVariants> {
    $$key?: number;
    items?: Array<{ id: string; title: string; content: React.ReactNode }>;
    classNames?: {
        base?: string;
        tabList?: string;
        tab?: string;
        cursor?: string;
    };
}

interface TabProps {
    key?: string;
    title: string;
    children: React.ReactNode;
}

const TabsView = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Root>,
    Omit<TabsProps, "onSelectionChange" | "selectedKey">
>( ( { $$key: _key, items, classNames, children, variant, ...props }, ref ) => {
    const [ selectedKey, setSelectedKey ] = React.useState( props.defaultValue );

    const component = useComponent( "UI/Tabs" );

    React.useEffect( () => {
        if ( ! component ) return;

        const handle = component.hook( "UI/Tabs/Select", ( _esult, args ) => {
            setSelectedKey( args?.key );
        } );

        return () => {
            handle?.dispose();
        };
    }, [ component ] );

    useChildCommandHook( "UI/Tabs/Trigger", "UI/Tabs/Trigger/Select", ( result, args ) => {
        component.run( "UI/Tabs/Select", { key: args?.key } );
    } );

    if ( items ) {
        return (
            <TabsPrimitive.Root
                ref={ ref }
                value={ selectedKey }
                className={ cn( tabsVariants( { variant } ), classNames?.base, props.className ) }
                { ...props }
            >
                <TabsList variant={ variant } className={ classNames?.tabList }>
                    { items.map( ( item ) => (
                        <TabsTrigger key={ item.id } value={ item.id } variant={ variant } className={ classNames?.tab }>
                            { item.title }
                        </TabsTrigger>
                    ) ) }
                </TabsList>
                { items.map( ( item ) => (
                    <TabsContent key={ item.id } value={ item.id }>
                        { item.content }
                    </TabsContent>
                ) ) }
            </TabsPrimitive.Root>
        );
    }

    return (
        <TabsPrimitive.Root
            ref={ ref }
            value={ selectedKey }
            className={ cn( tabsVariants( { variant } ), classNames?.base, props.className ) }
            { ...props }
        >
            { children }
        </TabsPrimitive.Root>
    );
} );
TabsView.displayName = "Tabs";

const Tabs = withCommands( "UI/Tabs", TabsView, [
    class Select extends CommandBase {
        public static getName() {
            return "UI/Tabs/Select";
        }
    }
] );

const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>
>( ( { className, variant, ...props }, ref ) => (
    <TabsPrimitive.List
        ref={ ref }
        className={ cn( tabsListVariants( { variant } ), className ) }
        { ...props }
    />
) );
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTriggerView = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsTriggerVariants>, "onClick"> & { $$key?: number }
>( ( { $$key: _key,className, variant, ...props }, ref ) => {
    const select = useCommand( "UI/Tabs/Trigger/Select" );

    return (
        <TabsPrimitive.Trigger
            ref={ ref }
            className={ cn( tabsTriggerVariants( { variant } ), className ) }
            onClick={ () => select.run( { key: props.value } ) }
            { ...props }
        />
    );
} );

TabsTriggerView.displayName = TabsPrimitive.Trigger.displayName;

const TabsTrigger = withCommands( "UI/Tabs/Trigger", TabsTriggerView, [
    class Select extends CommandBase {
        public static getName() {
            return "UI/Tabs/Trigger/Select";
        }
    }
] );

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>( ( { className, ...props }, ref ) => (
    <TabsPrimitive.Content
        ref={ ref }
        className={ cn(
            "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
        ) }
        { ...props }
    />
) );
TabsContent.displayName = TabsPrimitive.Content.displayName;

const Tab: React.FC<TabProps> = ( { children } ) => {
    return <>{ children }</>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent, Tab };
