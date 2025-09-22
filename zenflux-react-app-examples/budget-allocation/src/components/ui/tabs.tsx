import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
    items?: Array<{ id: string; title: string; content: React.ReactNode }>;
    classNames?: {
        base?: string;
        tabList?: string;
        tab?: string;
        cursor?: string;
    };
    selectedKey?: string;
    onSelectionChange?: (key: string) => void;
}

const Tabs = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Root>,
    TabsProps
>(({ items, classNames, selectedKey, onSelectionChange, children, ...props }, ref) => {
    if (items) {
        return (
            <TabsPrimitive.Root
                ref={ref}
                value={selectedKey}
                onValueChange={onSelectionChange}
                className={cn(classNames?.base, props.className)}
                {...props}
            >
                <TabsList className={classNames?.tabList}>
                    {items.map((item) => (
                        <TabsTrigger key={item.id} value={item.id} className={classNames?.tab}>
                            {item.title}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {items.map((item) => (
                    <TabsContent key={item.id} value={item.id}>
                        {item.content}
                    </TabsContent>
                ))}
            </TabsPrimitive.Root>
        );
    }

    return (
        <TabsPrimitive.Root
            ref={ref}
            value={selectedKey}
            onValueChange={onSelectionChange}
            className={cn(classNames?.base, props.className)}
            {...props}
        >
            {children}
        </TabsPrimitive.Root>
    );
});
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
        className={cn(
            "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
            className
        )}
        {...props}
    />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
            className
        )}
        {...props}
    />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn(
            "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
        )}
        {...props}
    />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// NextUI-compatible Tab component
interface TabProps {
    key?: string;
    title: string;
    children: React.ReactNode;
}

const Tab: React.FC<TabProps> = ({ title, children }) => {
    return <>{children}</>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent, Tab };
