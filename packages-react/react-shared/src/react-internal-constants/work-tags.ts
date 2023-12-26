// // TODO Enum
// export type WorkTag =
//     0
//     | 1
//     | 2
//     | 3
//     | 4
//     | 5
//     | 6
//     | 7
//     | 8
//     | 9
//     | 10
//     | 11
//     | 12
//     | 13
//     | 14
//     | 15
//     | 16
//     | 17
//     | 18
//     | 19
//     | 20
//     | 21
//     | 22
//     | 23
//     | 24
//     | 25
//     | 26
//     | 27;
//
// export const FunctionComponent = 0;
// export const ClassComponent = 1;
// export const IndeterminateComponent = 2; // Before we know whether it is function or class
//
// export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
//
// export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
//
// export const HostComponent = 5;
// export const HostText = 6;
// export const Fragment = 7;
// export const Mode = 8;
// export const ContextConsumer = 9;
// export const ContextProvider = 10;
// export const ForwardRef = 11;
// export const Profiler = 12;
// export const SuspenseComponent = 13;
// export const MemoComponent = 14;
// export const SimpleMemoComponent = 15;
// export const LazyComponent = 16;
// export const IncompleteClassComponent = 17;
// export const DehydratedFragment = 18;
// export const SuspenseListComponent = 19;
// export const ScopeComponent = 21;
// export const OffscreenComponent = 22;
// export const LegacyHiddenComponent = 23;
// export const CacheComponent = 24;
// export const TracingMarkerComponent = 25;
// export const HostHoistable = 26;
// export const HostSingleton = 27;

export enum WorkTag {
    FunctionComponent = 0,
    ClassComponent = 1,
    IndeterminateComponent = 2, // Before we know whether it is function or class
    HostRoot = 3, // Root of a host tree. Could be nested inside another node.
    HostPortal = 4, // A subtree. Could be an entry point to a different renderer.
    HostComponent = 5,
    HostText = 6,
    Fragment = 7,
    Mode = 8,
    ContextConsumer = 9,
    ContextProvider = 10,
    ForwardRef = 11,
    Profiler = 12,
    SuspenseComponent = 13,
    MemoComponent = 14,
    SimpleMemoComponent = 15,
    LazyComponent = 16,
    IncompleteClassComponent = 17,
    DehydratedFragment = 18,
    SuspenseListComponent = 19,
    ScopeComponent = 21,
    OffscreenComponent = 22,
    LegacyHiddenComponent = 23,
    CacheComponent = 24,
    TracingMarkerComponent = 25,
    HostHoistable = 26,
    HostSingleton = 27,
};
