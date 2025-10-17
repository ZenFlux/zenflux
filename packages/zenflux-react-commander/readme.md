# @zenflux/react-commander

A lightweight command orchestration layer for React that separates UI from behavior through typed Commands, per-instance component context, and a central command manager. Includes a minimal Query abstraction for data fetching, caching, and lifecycle wiring. a custom in-context state that operate on a level of that component, that should be wrapped by **withCommands()**, then you can define the state, and commands of this component.

## Why

- Clear separation of concerns: UI renders; Commands mutate state; Query modules fetch/persist
- Deterministic interactions: every user action is a named, typed Command
- Scalable coordination: cross-component communication without prop drilling
- Testability and observability built-in

## Core concepts

- Commands: classes with a stable name and typed args/state that perform side effects and state transitions
- Component context: each wrapped component has a unique id and event emitter; Commands run against a specific instance
- Command manager: single entry point to run and hook Commands, including scoped and global hooks
- Query modules: declare endpoints, request/response shaping, and cache keys; integrated with component lifecycles

## Quick start

Full working demo:
- Budget Allocation app (end-to-end Commands + Query usage): [apps-example/budget-allocation](https://github.com/ZenFlux/zenflux/tree/tmp/apps-example/budget-allocation)

### 1) Define a Command (domain: Items)

```ts
import { CommandBase } from "@zenflux/react-commander/command-base";

type Item = { id: string; name: string };
type ItemsState = { items: Item[] };

export class SetItemName extends CommandBase<ItemsState, { id: string; name: string }> {
  static getName() { return "App/ItemsList/SetName" }

  protected apply(args: { id: string; name: string }) {
    const items = (this.state.items ?? []).map(i => i.id === args.id ? { ...i, name: args.name } : i);
    return this.setState({ items });
  }
}
```

### 2) Wrap a component

```tsx
import React from "react";
import { withCommands } from "@zenflux/react-commander/with-commands";
import { useCommand, useCommandState } from "@zenflux/react-commander/hooks";

type Item = { id: string; name: string };
type ItemsState = { items: Item[] };

function ItemsList() {
  const setName = useCommand("App/ItemsList/SetName");
  const [slice] = useCommandState<ItemsState, { items: Item[] }>("App/ItemsList", s => ({ items: s.items ?? [] }));

  const renameFirst = () => {
    const first = slice.items[0];
    if (first) setName.run({ id: first.id, name: first.name + "!" });
  };

  return (
    <div>
      <button onClick={renameFirst}>Rename first</button>
      <ul>{slice.items.map(i => <li key={i.id}>{i.name}</li>)}</ul>
    </div>
  );
}

export const ItemsListWithCommands = withCommands<{}, ItemsState>(
  "App/ItemsList",
  ItemsList,
  { items: [] },
  [SetItemName]
);
```

### 3) Define a real Query module

The module declares endpoints, shapes data, and wires lifecycle hooks to the wrapped component instance. On mount, it can set initial component state from fetched data.

```ts
import { QueryListModuleBase } from "@zenflux/react-commander/query/module-base";
import type { DCommandFunctionComponent, DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

type Item = { id: string; name: string };

export class ItemsQuery extends QueryListModuleBase<Item> {
  static getName() { return "items" }
  protected getResourceName() { return "items" }

  protected registerEndpoints(): void {
    this.defineEndpoint<Array<{ id: string; name: string }>, Item[]>(
      "App/ItemsList",
      { method: "GET", path: "v1/items", prepareData: api => api.map(x => ({ id: x.id, name: x.name })) }
    );

    this.register("POST", "App/ItemsList/SetName", "v1/items/set-name");
  }

  protected async requestHandler(_element: DCommandFunctionComponent, request: Record<string, unknown>) {
    return request;
  }

  protected async responseHandler(_element: DCommandFunctionComponent, response: Response) {
    return await response.json();
  }

  protected onMount(context: DCommandSingleComponentContext, resource?: Item[]) {
    context.setState({ ...context.getState<Record<string, unknown>>(), items: resource ?? [] });
  }
}
```

See a full real-world module: `ChannelsListQuery`
- Source: https://github.com/ZenFlux/zenflux/blob/tmp/apps-example/budget-allocation/src/components/channels/channels-list-query.ts

### 4) Bootstrap Query and register modules

```tsx
import React from "react";
import { QueryClient } from "@zenflux/react-commander/query/client";
import { QueryProvider } from "@zenflux/react-commander/query/provider";

const client = new QueryClient("<API_BASE_URL>");
client.registerModule(ItemsQuery);

export function App() {
  return (
    <QueryProvider client={client}>
      {/* Render your query-backed components via Query.Component below */}
    </QueryProvider>
  );
}
```

### 5) Render a component with data via Query.Component

Query wires fetched data to the wrapped component through the module lifecycle (e.g., setting initial state in `onMount`).

```tsx
import { withCommands } from "@zenflux/react-commander/with-commands";

type ItemsState = { items: Item[] };
function ItemsList() {
  const [slice] = useCommandState<ItemsState, { items: Item[] }>("App/ItemsList", s => ({ items: s.items ?? [] }));
  return <ul>{slice.items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}

export const ItemsListWithCommands = withCommands<{}, ItemsState>(
  "App/ItemsList",
  ItemsList,
  { items: [] },
  []
);

const QueryComponent = client.Component;

<QueryComponent
  module={ItemsQuery}
  component={ItemsListWithCommands}
  props={{}}
/>;
```

## Benefits

### Undo/redo and history

- Every action is a named Command with args, enabling linear, replayable histories
- Commands can capture pre-state or provide inverse payloads to implement reversible steps
- Replaying histories rehydrates UI; higher-level undo is possible by squashing groups
- Per-instance scoping ensures undo targets the exact component instance

### Interaction logging and analytics

- Single choke point: `commandsManager.run` and Command global hooks enable consistent logging of name, args, result, timestamps
- Fully qualified names are stable keys for funnels, conversion, and anomaly detection

### LLM/MCP readiness

- Discoverable registry: enumerate commands to build a machine-readable catalog
- Stable tool surface: names + arg schemas map to MCP tools; per-command validation and instance scoping provide guardrails
- Replayable traces: plan, simulate, run, and roll back by composing Commands

### Testing

- Unit: instantiate Commands, call `execute` with state and `setState`, assert transitions and returns
- Integration: use scoped hooks to assert cross-component effects without prop drilling
- Data: memory query cache keeps tests fast; request/response shapers are easy to stub
- Record/replay: capture command logs from sessions and replay in CI

### Examples

#### Unit testing a command

```ts
import { CommandBase } from "@zenflux/react-commander/command-base";

type S = { count: number };
class Inc extends CommandBase<S, { delta: number }> {
  static getName() { return "App/Counter/Increment" }
  protected apply(a){ return this.setState({ count: this.state.count + a.delta }) }
}

test("Inc applies delta", async () => {
  const cmd = new (Inc as any)({})
  const holder = { state: { count: 0 } }
  ;(cmd as any).options = { state: holder.state, setState: (s: any, cb: any) => { holder.state = { ...holder.state, ...s }; cb?.(holder.state) } }
  await cmd.execute({ on: () => [], listeners: () => [] } as any, { delta: 2 } as any)
  expect(holder.state.count).toBe(2)
})
```

#### Integration testing with hooks

```tsx
function RenameButton({ id }: { id: string }) {
  const setName = useCommand("App/ChannelsList/SetName")
  return <button onClick={() => setName.run({ id, name: "X" })}>ok</button>
}

test("rename dispatches", async () => {
  const handler = vi.fn()
  // Example: attach a scoped hook to assert dispatch (pseudo)
  // commandsManager.hookByNameScoped({ commandName: "App/ChannelsList/SetName", componentName: "App/ChannelsList", ownerId: "t" }, handler)
  // render <RenameButton id="a" /> and click...
  expect(handler).toHaveBeenCalled()
})
```

## Recorder pattern (overview)

- Record: wrap dispatch to capture command name, args, component id, timestamp
- Play: provide `play(records)` to re-run the sequence
- Optional undo/redo: if commands provide inverses or pre-state snapshots
- Suggested surface: `start()`, `stop()`, `clear()`, `get()`, `play(records?)`, `undo()`, `redo()`

### Minimal Recorder API (example)

```ts
type Recorded = {
  at: number
  id: { commandName: string; componentName: string; componentNameUnique: string }
  args: Record<string, unknown>
};

class CommandRecorder {
  private records: Recorded[] = []
  private running = false

  start() { this.running = true }
  stop() { this.running = false }
  clear() { this.records = [] }
  get() { return [...this.records] }

  intercept(record: Recorded) { if (this.running) this.records.push(record) }

  async play(records = this.get()) {
    for (const r of records) {
      await commandsManager.run(r.id, r.args)
    }
  }
}

// Wire it globally (dev convenience)
const recorder = new CommandRecorder()
;(window as any).$$recorder = recorder

// Example: wrap calls to commandsManager.run to feed the recorder
// (pseudo-code) commandsManager.run = wrap(commandsManager.run, (id, args) => recorder.intercept({ at: Date.now(), id, args }))
```

## Observability and governance

- Global hooks for auditing and security checks per Command
- Centralized permission checks at dispatch-time by command name and args

## Conventions

- Use monorepo imports like `@zenflux/react-commander/...`
- All user actions should be Commands
- Prefer typed args/state for Commands
- Avoid hard-coded values; compute from context/props/state

- Naming convention for commands/modules/states: `App/Namespace/Component[/Sub]/Action`
  - Examples: `App/ChannelsList/SetName`, `App/ChannelItem/SetBreakdown`, `UI/Accordion/onSelectionAttached`
  - Pick one convention and use it consistently across the app

## FAQ

- Target a specific instance: use `useComponent` or `useCommand`
- Subscribe without rendering: use scoped hooks or global hooks
- Prefetch/read cache: use `QueryClient.cache` methods and module query keys

## How it fits together

### Big picture

- UI renders pure components.
- Every user action is a Command (named, typed) that updates per-component state.
- Components that need commands are wrapped with `withCommands` to get an instance context, state, and lifecycle wiring.
- Cross-component reactions use hooks (`useCommand`, `useComponent`, `useCommandHook`) instead of prop drilling.
- Data fetching/persistence is handled by Query modules, registered on a `QueryClient` and rendered via `QueryComponent` to wire module lifecycle into the wrapped component.
- Autosave and analytics are centralized via global hooks and `queryCreateAutoSaveManager`.

### End-to-end flow (example)

1. App bootstraps Query

```ts
const client = new QueryClient(BASE_URL);
client.registerModule(ChannelsListQuery);

function Root() {
  return (
    <QueryProvider client={client}>
      <App />
    </QueryProvider>
  );
}
```

2. Define UI with commands

```tsx
function ChannelsList(_props: ChannelListProps & { $data?: Channel[] }) {
  return <ChannelsListView />;
}

export const ChannelsListWithCommands = withCommands<ChannelListProps, ChannelListState>(
  "App/ChannelsList",
  ChannelsList,
  { channels: [], selected: {} },
  [AddRequest, SetName]
);
```

3. Render with data via Query

```tsx
const QueryComponent = client.Component;

<QueryComponent
  module={ChannelsListQuery}
  component={ChannelsListWithCommands}
  props={{ view: "accordion" }}
/>;
```

4. Handle user actions as commands

```tsx
function RenameButton({ id }: { id: string }) {
  const setName = useCommand("App/ChannelsList/SetName");
  return <button onClick={() => setName.run({ id, name: "New name" })}>Rename</button>;
}
```

5. Persist and observe centrally

```ts
// Autosave list on selection changes
const autosave = queryCreateAutoSaveManager<ChannelsListState, { key: string; channels: Channel[] }>({
  getKey: () => "channels-list",
  pickToSave: s => ({ key: "channels-list", channels: s.channels }),
  save: async input => { await client.fetch("POST", "v1/channels/list", input, r => r.json()); }
});

// Global analytics on SetName
const cmds = commandsManager.get("App/ChannelsList", true);
cmds["App/ChannelsList/SetName"].global().globalHook((_r, a) => console.log("set-name", a));
```

### Lifecycle reference

- `withCommands` injects lifecycle handlers from `QueryComponent` into the wrapped component instance via internal props.
- `QueryModuleBase` supports:
  - `load?(context)` → before initial render
  - `onMount?(context, resource)` → after component mounts with data
  - `onUpdate?(context, { currentProps, currentState, prevProps, prevState })`
  - `onUnmount?(context, resource)` → cleanup and final flush
  - `onContextStateUpdated?(context, hasChanged)` → granular state change hook

Typical patterns:
- Initialize component state in `onMount` using fetched `resource`.
- Schedule debounced saves in `onContextStateUpdated`.
- Flush pending work in `onUnmount`.

### Adoption checklist

- Define commands for all user actions with clear, fully-qualified names
- Wrap components that need state or commands with `withCommands`
- Use hooks (`useCommand`, `useCommandState`) in UI; avoid prop drilling
- Create Query modules to fetch/persist; register them on a `QueryClient`
- Render command-enabled components via `QueryComponent` for lifecycle wiring
- Add autosave with `queryCreateAutoSaveManager` where appropriate
- Attach global/scoped hooks for analytics and cross-component effects

## Public API (used by @app-budget-allocation)

### CommandBase<TState, TArgs>

- Import: `import { CommandBase } from "@zenflux/react-commander/command-base"`
- Purpose: Define a named, typed user action that can read/write component state and emit events
- When: Any user interaction you want to model deterministically (logging, undo/redo, testing)
- Signature (selected):

```ts
abstract class CommandBase<TState, TArgs = {}> {
  static getName(): string
  protected get state(): TState
  protected setState<K extends keyof TState>(state: TState | Pick<TState, K>, cb?: (s: TState) => void): Promise<void>
  protected validateArgs?(args: TArgs): void
  protected apply?(args: TArgs): Promise<unknown> | unknown
  static globalHook(fn: (result?: unknown, args?: TArgs) => void): void
  static globalUnhook(): void
}
```

```ts
class SetName extends CommandBase<ChannelListState, { id: string; name: string }> {
  static getName() { return "App/ChannelsList/SetName"; }
  protected apply(args) {
    const channels = this.state.channels.map(c =>
      c.meta.id === args.id ? { ...c, meta: { ...c.meta, name: args.name } } : c
    );
    return this.setState({ channels });
  }
}
```

### withCommands(componentName, Component, [state?], commands[])

- Import: `import { withCommands } from "@zenflux/react-commander/with-commands"`
- Purpose: Register command classes and provide a per-instance command context and optional state
- When: Wrapping any component that executes commands or exposes state to commands

```tsx
export const ChannelsListWithCommands = withCommands<ChannelListProps, ChannelListState>(
  "App/ChannelsList",
  ChannelsList,
  { channels: [], selected: {} },
  [AddRequest, EditRequest, RemoveRequest, SetName]
);
```

### commandsManager

- Import: `import commandsManager from "@zenflux/react-commander/commands-manager"`
- Purpose: Central registry and dispatcher; global/scoped hooks, discovery by component name
- When: Cross-component coordination, global analytics/auditing

```ts
const accordion = commandsManager.get("UI/Accordion", true);
accordion["UI/Accordion/onSelectionAttached"].global().globalHook(save);
accordion["UI/Accordion/onSelectionDetached"].global().globalHook(save);
```

### Types: DCommandFunctionComponent, DCommandArgs, DCommandSingleComponentContext

- Import: `import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions"`
- Purpose: Strong typing for command-enabled components and command payloads

```ts
export const ChannelsList: DCommandFunctionComponent<ChannelListProps & { $data?: Channel[] }, ChannelListState> = (props) => {/* ... */};
type SetBreakdownArgs = { index: number; value: string; source: UpdateSource };
```

### React hooks

All hooks are exported from `@zenflux/react-commander/hooks`:

```ts
export { useCommand } from "./use-command/use-command";
export { useComponent } from "./use-component/use-component";
export { useCommandState } from "./use-command-state";
export { useComponentWithRef } from "./use-component/use-component-with-ref";
export { useCommandRunner } from "./use-command/use-command-runner";
export { useCommandHook } from "./use-command/use-command-hook";
export { useChildCommandHook } from "./use-child-command/use-child-command-hook";
export { useChildCommandRunner } from "./use-child-command/use-child-command-runner";
```

### Command levels and context detection

- **use-component (Component-level)**: target a specific component instance by name and context.
  - **Context detection flow**: validates the current `ComponentIdContext` matches the provided component name via `getSafeContext`. When a `context` is explicitly provided, it uses that instead of the current provider.
  - **Best for**: operating on a known instance (current, parent, or injected instance), reading/writing state, and liveness checks.

- **use-command (Command-level)**: target commands by their fully qualified name.
  - **Context detection flow**:
    - Without `ref`: current context → component name match → on-demand (latest matching instance)
    - With `ref`: ref match → component name match → on-demand (latest matching instance)
  - **Best for**: dispatching or subscribing to a command without hard-coding a specific instance.

- **use-child-command (Child-level)**: target commands on descendant components of a given type.
  - **Context detection flow**: enumerates child component contexts from the current `ComponentIdContext`, filters alive instances, then hooks/runs on the matching subset.
  - **Best for**: broadcasting to or observing multiple child instances, or addressing a specific child by key.

#### useCommand(commandName)

- Import: `import { useCommand } from "@zenflux/react-commander/hooks"`
- Purpose: Intelligent command adapter that resolves commands by context, supports refs, and includes built-in fallback strategies
- Signature:
  - `useCommand(commandName: string): UseCommandAdapter`
  - `useCommand(commandName: string, ref: React.RefObject<any>): UseCommandAdapter | null`
- Returns: `{ run, hook, unhook, unhookHandle?, getInternalContext }`

- When to use:
  - Dispatch or subscribe to a command without coupling to a specific instance
  - Resolve the most relevant instance by context, name, or ref
  - Target a specific instance via `ref`

Resolution strategy:
1. If `ref` provided: tries ref match → name match → on-demand
2. Without `ref`: tries current context → name match → on-demand

```tsx
const setBreakdown = useCommand("App/ChannelItem/SetBreakdown");
setBreakdown.run({ index: 2, value: "1,000", source: UpdateSource.FROM_BUDGET_OVERVIEW });

// With ref for targeting specific instance
const itemRef = React.useRef();
const setName = useCommand("App/ChannelItem/SetName", itemRef);
if (setName) setName.run({ name: "New" });
```

#### useComponent(componentName, context?, options?)

- Import: `import { useComponent } from "@zenflux/react-commander/hooks"`
- Purpose: Target a specific component instance (current/parent/child) by context
- Returns: `{ run, hook, unhook, unhookHandle, getId, getKey, isAlive, getInternalContext, getContext, getState }`

- When to use:
  - Operate on a known instance (current, parent, or injected context)
  - Need strict scoping for reads/writes and lifecycle checks
  - Integrations that must not fall back to another instance

Context detection flow:
- Validates context with `getSafeContext`: the current provider must match `componentName` unless you pass a specific `context`.
- Resolves internal context using the component's unique id; methods operate strictly on that instance.

Methods:
- `run(commandName, args, callback?)`: dispatch a command against this instance
- `hook(commandName, handler)` / `unhook(commandName)`: subscribe/unsubscribe for this instance
- `unhookHandle(handle)`: unsubscribe using a returned hook handle
- `getId()`: get the unique id
- `getKey()`: read the instance key from internal context
- `isAlive()`: check if the instance is still mounted
- `getInternalContext()` / `getContext()`: access internal and provider contexts
- `getState<TState>()`: read current component state

```tsx
const item = useComponent("App/ChannelItem");
item.run("App/ChannelItem/SetFrequency", { value: "monthly" });

// Check if component is still mounted
if (item.isAlive()) {
  item.run("App/ChannelItem/SetName", { name: "Updated" });
}
```

#### useComponentWithRef(componentName, ref)

- Import: `import { useComponentWithRef } from "@zenflux/react-commander/hooks"`
- Purpose: Target a component instance by ref

- When to use:
  - You have a ref to a rendered instance (lists, portals)
  - You want exact targeting without relying on name mapping

```tsx
const itemRef = React.useRef();
const item = useComponentWithRef("App/ChannelItem", itemRef);
if (item) {
  item.run("App/ChannelItem/SetName", { name: "New" });
}
```

#### useCommandRunner(commandName, ref?)

- Import: `import { useCommandRunner } from "@zenflux/react-commander/hooks"`
- Purpose: Get a memoized runner function for a specific command using `useCommand` internally
- Signature: `useCommandRunner(commandName: string, ref?: React.RefObject<any>)`

- When to use:
  - Need a stable, memoized function to run a command
  - Passing a runner as a prop/callback without recreating the adapter
  - Targeting a specific instance with `ref`

```tsx
const runSetName = useCommandRunner("App/ChannelsList/SetName");
runSetName({ id: "123", name: "New" }, (result) => {
  console.log("Completed:", result);
});

// With ref for targeting specific instance
const itemRef = React.useRef();
const runItemCommand = useCommandRunner("App/ChannelItem/SetName", itemRef);
runItemCommand({ name: "New" });
```

#### useCommandState(componentName)

- Import: `import { useCommandState } from "@zenflux/react-commander/hooks"`
- Purpose: Read/write the injected component state (when provided via `withCommands`)
- Signature: `useCommandState<TState>(componentName): [() => TState, setState, () => boolean]`

```tsx
const [getState, setState, isMounted] = useCommandState<ChannelListState>("App/ChannelsList");
setState({ selected: { ...getState().selected, abc: true } });
```

- When to use:
  - Read/write the per-instance state injected by `withCommands`
  - Local UI state coordination and autosave flows
  - Access `isMounted` for safe async updates

Resolution strategy (current):
- Attempts to resolve internal context via `useCommand(componentOrCommandName)` for dynamic accuracy.
- If unavailable (e.g., early render or when passing a component name), falls back to resolving the current component context directly.
- Returns stable `getState`, `setState`, and `isMounted` from the resolved internal context.

#### useCommandState<TState, TSelected>(componentName, selector, options?)

- Import: `import { useCommandState } from "@zenflux/react-commander/hooks"`
- Purpose: Subscribe to derived slices with granular re-rendering using `useSyncExternalStore`
- Signature: `useCommandState<TState, TSelector>(componentName, selector, options?): [TSelector, setState, () => boolean]`
- Options: `{ equalityFn?: (a: TSelector, b: TSelector) => boolean }` (defaults to `shallowEqual`)

```tsx
const [slice, setState, isMounted] = useCommandState<ChannelItemTableState, { editing: boolean[] }>(
  "App/ChannelItem",
  s => ({ editing: s.editing ?? [] })
);
```

- When to use:
  - Subscribe to a derived slice to minimize re-renders
  - Fine-tune equality comparisons for complex slices
  - Compose multiple lightweight selectors in a component

Notes:
- Uses `useSyncExternalStore` for consistent subscription semantics and change propagation.
- Subscribes to `INTERNAL_STATE_UPDATED_EVENT` and recalculates only when the selected slice changes by `equalityFn`.

#### useCommandHook(commandName, handler, ref?)

- Import: `import { useCommandHook } from "@zenflux/react-commander/hooks"`
- Purpose: Declarative (un)subscription to a command using `useCommand` internally with automatic cleanup
- Uses the same resolution strategy as `useCommand` (current context → name match → on-demand)

- When to use:
  - Observe command results for analytics, logging, or side-effects
  - React to commands dispatched from this or other instances
  - Bind to a specific instance via `ref`

```tsx
useCommandHook("App/ChannelsList/SetName", (_result, args) => { /* analytics */ });

// With ref for specific instance
const itemRef = React.useRef();
useCommandHook("App/ChannelItem/SetName", (result, args) => {
  console.log("Item renamed:", args);
}, itemRef);
```

#### useChildCommandHook(childComponentName, commandName, handler, opts?)

- Import: `import { useChildCommandHook } from "@zenflux/react-commander/hooks"`
- Purpose: Subscribe to a command on all child components of a specific type
- Options: `{ filter?: (cmd) => boolean; ignoreDuplicate?: boolean }`
- Automatically filters out unmounted children

- When to use:
  - Parent needs to observe events across many child instances
  - Aggregate effects like autosave, analytics, or selection sync
  - Optionally filter to a subset via `opts.filter`

Context detection flow:
- Discovers child instances from the current component tree, filters alive ones, applies optional `filter`, and hooks them.

```tsx
useChildCommandHook("App/ChannelItem", "App/ChannelItem/SetName", (result, args) => {
  console.log("Child item renamed:", args);
});
```

See a real usage example:
- [Parent listening to child command updates in ChannelsList accordion interactions](https://github.com/ZenFlux/zenflux/blob/tmp/apps-example/budget-allocation/src/components/channels/channels-list-accordion-interactions.tsx#L25-L34)

#### useChildCommandRunner(childComponentName, selector)

- Import: `import { useChildCommandRunner } from "@zenflux/react-commander/hooks"`
- Purpose: Run commands on child components by key/selector
- Returns: `(key: string, commandName: string, args: DCommandArgs) => boolean`

- When to use:
  - Address a specific child by a stable key (e.g., id)
  - Trigger actions from parent toolbars/menus onto a selected child
  - Programmatic control over child instances without prop drilling

Context detection flow:
- Enumerates alive children; maps each internal context to a key via `selector`; dispatches to the matching child. Returns `true` if a target was found and run.

```tsx
const runOnChild = useChildCommandRunner("App/ChannelItem", ctx => ctx.key);
runOnChild("item-123", "App/ChannelItem/SetName", { name: "New" });
```

See a real usage example:
- [Parent targeting a specific child instance by key](https://github.com/ZenFlux/zenflux/blob/tmp/apps-example/budget-allocation/src/components/channels/channels-list-accordion-interactions.tsx#L36-L39)

### Query/data modules

#### QueryComponent

- Import: `import { QueryComponent } from "@zenflux/react-commander/query/component"`
- Purpose: Suspense bridge to load module data and inject lifecycle hooks

```tsx
<QueryComponent
  module={ChannelsListQuery}
  component={ChannelsListWithCommands}
  props={{ view: "accordion" }}
/>;
```

#### QueryProvider and helpers

- Import: `import { QueryProvider, getQueryModule } from "@zenflux/react-commander/query/provider"`
- Purpose: Provide a client to descendants and retrieve modules

```tsx
const module = getQueryModule(ChannelsListQuery);
const channel = await module.request("App/ChannelsList/AddChannel");
```

#### QueryModuleBase<TResource>

- Import: `import { QueryModuleBase } from "@zenflux/react-commander/query/module-base"`
- Purpose: Define endpoints, request/response shaping, cache keys, and lifecycle hooks

```ts
abstract class QueryModuleBase<TResource> {
  static getName(): string
  protected getResourceName(): string
  protected registerEndpoints(): void
  protected defineEndpoint<TApi, TData>(name: string, cfg: { method: string; path: string; prepareData?: (api: TApi) => TData }): void
  protected register(method: string, name: string, route: string | { path: string }): void
  request<TResult>(name: string, args?: Record<string, unknown>): Promise<TResult>
  getData<TData>(element: DCommandFunctionComponent, args?: Record<string, unknown>): Promise<TData>
}
```

#### QueryItemModuleBase<TEntity>

- Import: `import { QueryItemModuleBase } from "@zenflux/react-commander/query/item-module-base"`
- Purpose: Specialization for single-entity operations

```ts
export class ChannelItemQuery extends QueryItemModuleBase<ChannelItemApiResponse> {
  static getName() { return "Query/ChannelItemQuery"; }
  protected getResourceName() { return "channels"; }
  protected registerEndpoints() {
    this.defineEndpoint<ChannelItemApiResponse, Channel>("App/ChannelItem", { method: "GET", path: "v1/channels/:key" });
    this.register("POST", "App/ChannelItem", "v1/channels/:key");
  }
}
```

#### QueryListModuleBase<TEntity>

- Import: `import { QueryListModuleBase } from "@zenflux/react-commander/query/list-module-base"`
- Purpose: Specialization for list operations (list/item cache keys, save/delete helpers)

```ts
export class ChannelsListQuery extends QueryListModuleBase<Channel> {
  static getName() { return "channels"; }
  protected getResourceName() { return "channels"; }
  protected registerEndpoints() {
    this.defineEndpoint<ChannelListApiResponse[], Channel[]>("App/ChannelsList", {
      method: "GET",
      path: "v1/channels",
      prepareData: api => api.map(transformChannelFromListApi)
    });
    this.register("POST", "App/ChannelsList/SetName", "v1/channels/set-name");
  }
}
```

#### queryCreateAutoSaveManager<TState, TSave>(options)

- Import: `import { queryCreateAutoSaveManager } from "@zenflux/react-commander/query/auto-save-manager"`
- Purpose: Debounced/interval-batched autosave keyed by entity

```ts
const autosave = queryCreateAutoSaveManager<ChannelsListState, { key: string; channels: Channel[] }>({
  getKey: () => "channels-list",
  pickToSave: s => ({ key: "channels-list", channels: s.channels }),
  save: async input => { await api.fetch("POST", "v1/channels/list", input, r => r.json()); },
  debounceMs: 800,
  intervalMs: 5000
});
```

#### queryDiffById<T>(prev, curr, getId)

- Import: `import { queryDiffById } from "@zenflux/react-commander/query/list-diff"`
- Purpose: Compute `{ added, removed }` between two lists by id

```ts
const { added, removed } = queryDiffById(prevChannels, nextChannels, c => c.meta.id);
```

