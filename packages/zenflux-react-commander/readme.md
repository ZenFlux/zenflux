# @zenflux/react-commander

A lightweight command orchestration layer for React that separates UI from behavior through typed Commands, per-instance component context, and a central command manager. Includes a minimal Query abstraction for data fetching, caching, and lifecycle wiring.

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

### Define a Command

```ts
import { CommandBase } from "@zenflux/react-commander/command-base";

type CounterState = { count: number };
type IncrementArgs = { delta: number };

export class Increment extends CommandBase<CounterState, IncrementArgs> {
  public static getName() {
    return "App/Counter/Increment";
  }

  protected async apply(args: IncrementArgs) {
    const next = { count: this.state.count + args.delta };
    await this.setState(next);
    return next.count;
  }
}
```

### Wrap a component and use the Command

```tsx
import React from "react";
import { withCommands } from "@zenflux/react-commander/with-commands";
import { useCommand, useCommandState } from "@zenflux/react-commander/hooks";
import { Increment } from "./increment";

type CounterState = { count: number };

function Counter(_props: {}, _state?: CounterState) {
  const inc = useCommand("App/Counter/Increment");
  const [slice] = useCommandState<CounterState, { count: number }>(
    "App/Counter",
    s => ({ count: s.count })
  );

  return <button onClick={() => inc.run({ delta: 1 })}>{slice.count}</button>;
}

export const CounterWithCommands = withCommands<{}, CounterState>(
  "App/Counter",
  Counter,
  { count: 0 },
  [Increment]
);
```

### Query client and provider

```tsx
import React from "react";
import { QueryClient } from "@zenflux/react-commander/query/client";
import { QueryProvider } from "@zenflux/react-commander/query/provider";

const client = new QueryClient("<API_BASE_URL>");

export function App() {
  return (
    <QueryProvider client={client}>
      <CounterWithCommands />
    </QueryProvider>
  );
}
```

Register modules once at startup:

```ts
import { ChannelsListQuery } from "@zenflux/app-budget-allocation/src/components/channels/channels-list-query";

client.registerModule(ChannelsListQuery);
```

Render a component with data via the Query component:

```tsx
const QueryComponent = client.Component;

<QueryComponent
  module={ChannelsListQuery}
  component={YourListComponent}
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
export { useCommandMatch } from "./use-command-match";
export { useCommandState } from "./use-command-state";
export { useCommandId } from "./use-command-id";
export { useComponentWithRef } from "./use-component/use-component-with-ref";
export { useCommandRunner } from "./use-command/use-command-runner";
export { useCommandHook } from "./use-command/use-command-hook";
export { useLocalCommandHook } from "./use-local-command-hook";
export { useChildCommandHook } from "./use-child-command/use-child-command-hook";
export { useChildCommandRunner } from "./use-child-command/use-child-command-runner";
export { useCommanderChildrenComponents } from "./use-commander-children-components";
```

**Notable changes in recent refactor:**
- `useCommandOnDemand` removed - its functionality is now built into `useCommand` as a fallback strategy
- `useCommandWithRef` removed - use `useCommand(commandName, ref)` instead
- `useCommand` now supports smart resolution with fallback strategies and optional ref parameter
- `useCommandHook` simplified to use `useCommand` internally
- New hooks added: `useChildCommandHook`, `useChildCommandRunner`, `useCommanderChildrenComponents`

#### useCommand(commandName)

- Import: `import { useCommand } from "@zenflux/react-commander/hooks"`
- Purpose: Intelligent command adapter that resolves commands by context, supports refs, and includes built-in fallback strategies
- Signature:
  - `useCommand(commandName: string): UseCommandAdapter`
  - `useCommand(commandName: string, ref: React.RefObject<any>): UseCommandAdapter | null`
- Returns: `{ run, hook, unhook, unhookHandle?, getInternalContext }`

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

#### useCommandHook(commandName, handler, ref?)

- Import: `import { useCommandHook } from "@zenflux/react-commander/hooks"`
- Purpose: Declarative (un)subscription to a command using `useCommand` internally with automatic cleanup
- Uses the same resolution strategy as `useCommand` (current context → name match → on-demand)

```tsx
useCommandHook("App/ChannelsList/SetName", (_result, args) => { /* analytics */ });

// With ref for specific instance
const itemRef = React.useRef();
useCommandHook("App/ChannelItem/SetName", (result, args) => {
  console.log("Item renamed:", args);
}, itemRef);
```

#### useLocalCommandHook(commandName, handler)

- Import: `import { useLocalCommandHook } from "@zenflux/react-commander/hooks"`
- Purpose: Shorthand to bind a hook to the current component instance (uses the component's own ref from context)

```tsx
useLocalCommandHook("UI/Accordion/onSelectionAttached", () => {/* ... */});
```

#### useChildCommandHook(childComponentName, commandName, handler, opts?)

- Import: `import { useChildCommandHook } from "@zenflux/react-commander/hooks"`
- Purpose: Subscribe to a command on all child components of a specific type
- Options: `{ filter?: (cmd) => boolean; ignoreDuplicate?: boolean }`
- Automatically filters out unmounted children

```tsx
useChildCommandHook("App/ChannelItem", "App/ChannelItem/SetName", (result, args) => {
  console.log("Child item renamed:", args);
});
```

#### useChildCommandRunner(childComponentName, selector)

- Import: `import { useChildCommandRunner } from "@zenflux/react-commander/hooks"`
- Purpose: Run commands on child components by key/selector
- Returns: `(key: string, commandName: string, args: DCommandArgs) => boolean`

```tsx
const runOnChild = useChildCommandRunner("App/ChannelItem", ctx => ctx.key);
runOnChild("item-123", "App/ChannelItem/SetName", { name: "New" });
```

#### useCommanderChildrenComponents(componentName, onChildrenUpdate?)

- Import: `import { useCommanderChildrenComponents } from "@zenflux/react-commander/hooks"`
- Purpose: Get all child components of a specific type with automatic lifecycle tracking
- Returns: Array of component adapters with `{ run, hook, unhook, getId, getKey, isAlive, getInternalContext, getContext, getState }`
- Filters out unmounted children automatically

```tsx
const channelItems = useCommanderChildrenComponents("App/ChannelItem", (children) => {
  console.log(`${children.length} channel items mounted`);
  return () => console.log("cleanup");
});
```

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

