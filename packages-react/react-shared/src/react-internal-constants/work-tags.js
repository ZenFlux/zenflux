"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkTag = void 0;
var WorkTag;
(function (WorkTag) {
    WorkTag[WorkTag["FunctionComponent"] = 0] = "FunctionComponent";
    WorkTag[WorkTag["ClassComponent"] = 1] = "ClassComponent";
    WorkTag[WorkTag["IndeterminateComponent"] = 2] = "IndeterminateComponent";
    WorkTag[WorkTag["HostRoot"] = 3] = "HostRoot";
    WorkTag[WorkTag["HostPortal"] = 4] = "HostPortal";
    WorkTag[WorkTag["HostComponent"] = 5] = "HostComponent";
    WorkTag[WorkTag["HostText"] = 6] = "HostText";
    WorkTag[WorkTag["Fragment"] = 7] = "Fragment";
    WorkTag[WorkTag["Mode"] = 8] = "Mode";
    WorkTag[WorkTag["ContextConsumer"] = 9] = "ContextConsumer";
    WorkTag[WorkTag["ContextProvider"] = 10] = "ContextProvider";
    WorkTag[WorkTag["ForwardRef"] = 11] = "ForwardRef";
    WorkTag[WorkTag["Profiler"] = 12] = "Profiler";
    WorkTag[WorkTag["SuspenseComponent"] = 13] = "SuspenseComponent";
    WorkTag[WorkTag["MemoComponent"] = 14] = "MemoComponent";
    WorkTag[WorkTag["SimpleMemoComponent"] = 15] = "SimpleMemoComponent";
    WorkTag[WorkTag["LazyComponent"] = 16] = "LazyComponent";
    WorkTag[WorkTag["IncompleteClassComponent"] = 17] = "IncompleteClassComponent";
    WorkTag[WorkTag["DehydratedFragment"] = 18] = "DehydratedFragment";
    WorkTag[WorkTag["SuspenseListComponent"] = 19] = "SuspenseListComponent";
    WorkTag[WorkTag["ScopeComponent"] = 21] = "ScopeComponent";
    WorkTag[WorkTag["OffscreenComponent"] = 22] = "OffscreenComponent";
    WorkTag[WorkTag["LegacyHiddenComponent"] = 23] = "LegacyHiddenComponent";
    WorkTag[WorkTag["CacheComponent"] = 24] = "CacheComponent";
    WorkTag[WorkTag["TracingMarkerComponent"] = 25] = "TracingMarkerComponent";
    WorkTag[WorkTag["HostHoistable"] = 26] = "HostHoistable";
    WorkTag[WorkTag["HostSingleton"] = 27] = "HostSingleton";
})(WorkTag || (exports.WorkTag = WorkTag = {}));
;
