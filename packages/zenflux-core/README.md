# @zenflux/core

Core runtime layer for the ZenFlux ecosystem. It provides the building blocks for registering controllers, running commands (public, internal, RESTful), HTTP client helpers, logging, and lifecycle hooks that wire everything together.

## Features
- Command registry with before/after hooks (data + UI) and cross-command triggers.
- Controller base that auto-registers public, internal, and RESTful commands.
- RESTful manager built on `fetch`, with pluggable error/response handlers.
- Lightweight logger class exposed via `zCore.classes.Logger`.
- Simple lifecycle helpers: `initialize`, `destroy`, `onAfterInitialize`.

## Installation

```bash
bun add @zenflux/core
```

## Quick start

```ts
import Core, { initialize, managers, bases, commandBases } from "@zenflux/core";

initialize({
  baseURL: "https://api.example.com",
  requestInit: { credentials: "include" },
});

class UsersController extends bases.ControllerBase {
  protected getRestful() {
    return { GetUser };
  }
}

class GetUser extends commandBases.CommandRestful {
  static getName() {
    return "users.get";
  }
  getEndpoint() {
    return "/v1/users/{id}";
  }
}

new UsersController();

const user = await managers.restful.get("users.get", { id: 42 });
```

### Lifecycle-aware hooks

```ts
import { managers } from "@zenflux/core";

managers.commands.onAfter("users.get", (_args) => {
  console.info("User fetched, refresh UI");
});

managers.commands.onAfterAffect("users.get", "analytics.track");
```

## REST handlers

You can intercept every REST call made through `managers.restful`:

```ts
import { interfaces, managers } from "@zenflux/core";

const { E_RESPONSE_HANDLER_TYPE } = interfaces;

managers.restful.setHandler(E_RESPONSE_HANDLER_TYPE.ERROR_HANDLER, (error) => {
  console.error("API error", error);
  return false; // return true to swallow the error
});
```

## Configuration (initialize)
- `version` (string, required): usually pulled from `package.json`.
- `baseURL` (string, optional): prepended to every RESTful endpoint.
- `requestInit` (RequestInit, optional): defaults to `{ credentials: "include" }`; merged per request.

## Command types at a glance
- `CommandPublic`: UI/data commands callable via `managers.commands.run()`.
- `CommandRestful`: wraps an HTTP call; use `managers.restful.get|create|update|delete()`.
- `CommandInternal`: internal orchestration; accessed through `managers.internal`.

```ts
// Creating data via REST
await managers.restful.create("users.create", { name: "Ava" });

// Updating with PATCH
await managers.restful.update("users.update", { id: 5, name: "Ava B" });
```

### Public command example

```ts
import { bases, commandBases } from "@zenflux/core";

class PostsController extends bases.ControllerBase {
  protected getCommands() {
    return { ListPosts };
  }
}

class ListPosts extends commandBases.CommandPublic {
  static getName() {
    return "posts.list";
  }

  protected async apply() {
    // use managers, services, or fetch directly
    return [{ id: 1, title: "Hello" }];
  }
}

new PostsController();
const posts = await managers.commands.run("posts.list");
```

## TypeScript & bundling
- ESM-first (`"type": "module"`); CJS builds available via `exports.default`.
- Deep imports for debugging are exposed in `exports` (e.g. `@zenflux/core/src/bases`).
- Types are shipped at `dist/zenflux-core.d.ts`.

## Core concepts
- **Commands**: atomic units of work; can be public, internal, or RESTful.
- **Controllers**: group commands and register them with managers automatically.
- **Managers**: orchestrate command lookup, execution, hooks, and REST plumbing.
- **Logger**: structured logging with per-instance ids; available via `classes.Logger`.
- **Globals**: in dev, exported as `globalThis.zCore` for quick introspection.

## API surface (cheat sheet)
- `managers.commands.run(name, args?, options?)` – execute public/internal commands.  
- `managers.restful.get|create|update|delete(name, args?, options?)` – HTTP-backed commands.  
- `managers.commands.onBefore / onAfter / onAfterOnce / onAfterAffect / onBeforeUI / onAfterUI` – hook orchestration.  
- `managers.commands.getLogger()` – logger bound to the command manager.  
- `bases.ControllerBase` – subclass and override `getCommands/getRestful/getInternal`.  
- `classes.Logger` – lightweight logger; supports `startsWith`, `drop`, `log`, etc.

## Command lifecycle (data + UI)
1) `managers.*.run()` attaches the command instance and stores args.  
2) `onBefore` + `onBeforeUI` fire (UI hooks are kept separate).  
3) `apply()` inside your command executes (do your work here).  
4) `onAfter / onAfterUI` fire; `onAfterOnce` is consumed.  
5) `onAfterAffect` triggers dependent commands (fan-out).  
6) Command detaches; trace kept in `Commands.trace`.

## REST handlers (types)
- `ERROR_HANDLER` – inspect/stop errors (return `true` to swallow).  
- `RESPONSE_FILTER` – transform raw text before JSON parse.  
- `RESPONSE_HANDLER` – inspect parsed data (return `true` to swallow).  
Register via `managers.restful.setHandler(E_RESPONSE_HANDLER_TYPE.*, cb)`.

### Internal command example

```ts
import { bases, commandBases } from "@zenflux/core";

class SystemController extends bases.ControllerBase {
  protected getInternal() {
    return { WarmCache };
  }
}

class WarmCache extends commandBases.CommandInternal {
  static getName() {
    return "system.warmCache";
  }
  protected async apply() {
    // populate LRU, prime REST calls, etc.
    return true;
  }
}

new SystemController();
await managers.internal.run("system.warmCache");
```

## Controller checklist
- Define a controller per bounded context (e.g., Users, Billing).  
- Implement `getCommands/getRestful/getInternal` returning plain object maps.  
- Use `setupHooks` to wire UI/data hooks in one place.  
- Keep RESTful commands thin—validation + endpoint, leave data shaping to callers.  
- Prefer small, composable commands; fans out via `onAfterAffect`.

## Configuration defaults
```ts
initialize({
  version: pkg.version,
  baseURL: "http://localhost",
  requestInit: { credentials: "include" },
});
```

## Performance & debugging
- Use `Commands.trace` to inspect recent command flow.  
- Keep hooks side-effect free where possible; heavy work stays in commands.  
- Logger spans (`startsWith`/`drop`) help spot slow sections.  
- In dev, read `globalThis.zCore.managers` to poke running instances.

## Known limitations
- No built-in retries/backoff for REST; add in your handlers.  
- Hooks are synchronous; await inside callbacks if you need async chaining.  
- Global `zCore` is exposed only in development builds.  
- REST client assumes `fetch` is available (polyfill in Node if needed).

## Folder map (high level)
- `src/bases` – abstract bases for objects, controllers, commands.
- `src/command-bases` – public/internal/RESTful command base classes.
- `src/managers` – command/REST/controller/internal managers + lifecycle.
- `src/clients` – HTTP client wrapper used by REST manager.
- `src/modules/logger` – logger implementation and config.
- `src/interfaces` – shared enums, types, and config contracts.

## Error handling patterns
- REST: set `ERROR_HANDLER` to normalize API errors into domain objects; throw to bubble.  
- Commands: throw your own error classes; subscribe with `onAfter` to centralize toast/UI.  
- Controllers: validate args in `apply` and short-circuit with informative errors.  
- `CommandNotFound` / `CommandAlreadyRegistered` guard misconfiguration early.

## Logging tips
- Create one logger per service/command: `new classes.Logger(MyCommand)`.  
- Use `startsWith` for timed spans and argument snapshots; `drop` to close them.  
- In browsers, rely on `globalThis.zCore` to inspect `managers` and `Logger` output quickly.

## Minimal setup (repo)
```bash
# install deps
bun install
# build only core
bun run --filter @zenflux/core @z-core--build
# link locally in another package
bun link ./packages/zenflux-core
```

## Testing
- Unit/integration: `bun run --filter @zenflux/core @z-core--test`.  
- Add new commands with small fixtures under `packages/zenflux-core/test`.  
- Prefer deterministic tests; mock `fetch` for REST managers.

## FAQ
- *Do I have to call `initialize`?* Yes—managers rely on it; call once at app boot.  
- *Can I skip globals?* In production bundlers, `zCore` is not required; ignore it.  
- *How do I extend logging?* Wrap `classes.Logger` or pipe its output to your collector.  
- *Is CJS supported?* Yes via `exports.default`; ESM is the primary target.  
- *Can I deep-import source files?* Yes for debugging via `@zenflux/core/src/*` paths.

## Logging

```ts
import { classes } from "@zenflux/core";

const logger = new classes.Logger(MyService);
logger.log("Ready"); // includes class name and unique instance id
```

## Lifecycle
- `initialize(config)` – sets up managers; config accepts `version`, optional `baseURL`, and `requestInit`.
- `destroy()` – clears managers and global state.
- `onAfterInitialize(cb)` – run a callback after core initialization.

## Local development

Run from repo root:

```bash
bun run --filter @zenflux/core @z-core--build   # build
bun run --filter @zenflux/core @z-core--test    # tests
bun run --filter @zenflux/core @z-core--dev     # watch
```

---

While developing, `@zenflux/core` exposes itself as `globalThis.zCore` to aid debugging in environments without import tooling. Use it only for development tooling or debugging.
