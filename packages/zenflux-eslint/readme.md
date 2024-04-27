# @zenflux/eslint

---

## 🛠️ Installation
Via package manager, `bun install @zenflux/eslint`


## 💻 Usage
```javascript
// eslint.config.js
import path from "node:path";

import { fileURLToPath } from "node:url";

import { zLintGetDefaultConfig, zLintSetRootPackagePath } from "@zenflux/eslint";

zLintSetRootPackagePath( path.resolve(
    path.dirname( fileURLToPath( import.meta.url ) ),
    "package.json"
) );

const config = zLintGetDefaultConfig();

export default config;

```
