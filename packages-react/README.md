# React DOM Reconciler
- Includes minimal packages to have stand-alone *react-reconciler* for DOM  covered by typescript.

## Details
- Mainly used for testing `@zenflux` environment
- `react-x-env` stands for react external environment
- Include custom modified code
- Reduced circular dependencies
- Removed unnecessary dependencies
- Do not use in production unless you know what you are doing
- 99% of the react tests which are involved in the react-packages in this repo are passing the rest 1% is (skipped):
    - Depending on packages which are not part of __ZenFlux__ port eg `react-dom`
    - Not passing on the original react repo either
    - Skipped in the original repo as well

## Copyrights
Copyright (c) Meta Platforms, Inc. and affiliates.
