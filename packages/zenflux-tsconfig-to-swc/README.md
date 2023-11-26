# @zenflux/tsconfig-to-swc

This package provides utilities for converting TypeScript compiler options to SWC compiler options, with support
of `tsconfig.json` *extends* field.

## Installation

```bash
bun install @zenflux/tsconfig-to-swc
```

## Usage

```typescript
import { convertTsConfig, readTsConfig } from "@zenflux/tsconfig-to-swc";

const tsConfig = readTsConfig( "./tsconfig.json" );

const swcOptions = convertTsConfig( tsConfig );

console.log( swcOptions );
```

---

## API

### `readTsConfig(tsConfigPath, [readConfigCallback])`

Reads and parses a TypeScript Configuration file.

**Arguments:**

* `tsConfigPath`: `string` - The file path of the TypeScript Configuration file.
* `readConfigCallback`: `(path: string) => string | undefined` - Optional callback function for reading config files.

**Throws:**

* `Error` - Throws an error if there is an error reading or parsing the file.

**Returns:**

* `ts.ParsedCommandLine`: The parsed TypeScript Configuration object.

**Example:**
```typescript
const tsConfigPath = "path/to/tsconfig.json";

try {
    const tsConfig = tsconfigToSwc.readTsConfig( tsConfigPath );
    console.log( "Parsed TypeScript Configuration:", tsConfig );
} catch ( error ) {
    console.error( "Error reading or parsing TypeScript Configuration:", error.message );
}

```

---

### `convertTsConfig(tsConfig, [inherentOptionsSwcOptions])`

Converts TypeScript compiler options to SWC compiler options

**Arguments:**

* `tsConfig`: `ts.ParsedCommandLine` - TypeScript parsed configuration object
* `inherentOptionsSwcOptions`: `swc.Options` - SWC compiler options object. Default to an empty object

**Returns:**
* `swc.Options`: - The converted/customized SWC options

**Example:**
```typescript
const tsConfig = tsconfigToSwc.readTsConfig( "path/to/tsconfig.json" );
const swcOptions = tsconfigToSwc.convertTsConfig( tsConfig );
console.log( "SWC Compiler Options:", swcOptions );
```

---

### `convertScriptTarget(target)`

Converts TypeScript's ScriptTarget version to SWC JscTarget version.

**Arguments:**

* `target`: `ts.ScriptTarget` - The TypeScript's ScriptTarget version.

**Returns:**

* `swc.JscTarget`: - The corresponding SWC JscTarget version.

---

### `convertModuleOptions(compilerOptions)`

Converts TypeScript CompilerOptions to SWC ModuleConfig.

**Arguments:**

* `compilerOptions`: `ts.CompilerOptions` - TypeScript CompilerOptions

**Returns:**

* `swc.ModuleConfig`: - The corresponding SWC ModuleConfig
