import { enableSchedulingProfiler } from "@zenflux/react-shared/src/react-feature-flags";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";
import { HookFlags } from "@zenflux/react-shared/src/react-internal-constants/hook-flags";

import {
    markComponentLayoutEffectMountStarted,
    markComponentLayoutEffectMountStopped,
    markComponentLayoutEffectUnmountStarted,
    markComponentLayoutEffectUnmountStopped,
    markComponentPassiveEffectMountStarted,
    markComponentPassiveEffectMountStopped,
    markComponentPassiveEffectUnmountStarted,
    markComponentPassiveEffectUnmountStopped
} from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";
import { setIsRunningInsertionEffect } from "@zenflux/react-reconciler/src/react-fiber-work-running-insertion-effect";
import { safelyCallDestroy } from "@zenflux/react-reconciler/src/react-fiber-commit-phase-error";

import type { FunctionComponentUpdateQueue } from "@zenflux/react-shared/src/react-internal-types/queue";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

export function commitHookEffectListUnmount( flags: HookFlags, finishedWork: Fiber, nearestMountedAncestor: Fiber | null ) {
    const updateQueue: FunctionComponentUpdateQueue | null = ( finishedWork.updateQueue as any );
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

    if ( lastEffect !== null ) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;

        do {
            if ( ( effect.tag & flags ) === flags ) {
                // Unmount
                const inst = effect.inst;
                const destroy = inst.destroy;

                if ( destroy !== undefined ) {
                    inst.destroy = undefined;

                    if ( enableSchedulingProfiler ) {
                        if ( ( flags & HookFlags.Passive ) !== HookFlags.NoHookEffect ) {
                            markComponentPassiveEffectUnmountStarted( finishedWork );
                        } else if ( ( flags & HookFlags.Layout ) !== HookFlags.NoHookEffect ) {
                            markComponentLayoutEffectUnmountStarted( finishedWork );
                        }
                    }

                    if ( __DEV__ ) {
                        if ( ( flags & HookFlags.Insertion ) !== HookFlags.NoHookEffect ) {
                            setIsRunningInsertionEffect( true );
                        }
                    }

                    safelyCallDestroy( finishedWork, nearestMountedAncestor, destroy );

                    if ( __DEV__ ) {
                        if ( ( flags & HookFlags.Insertion ) !== HookFlags.NoHookEffect ) {
                            setIsRunningInsertionEffect( false );
                        }
                    }

                    if ( enableSchedulingProfiler ) {
                        if ( ( flags & HookFlags.Passive ) !== HookFlags.NoHookEffect ) {
                            markComponentPassiveEffectUnmountStopped();
                        } else if ( ( flags & HookFlags.Layout ) !== HookFlags.NoHookEffect ) {
                            markComponentLayoutEffectUnmountStopped();
                        }
                    }
                }
            }

            effect = effect.next;
        } while ( effect !== firstEffect );
    }
}

export function commitHookEffectListMount( flags: HookFlags, finishedWork: Fiber ) {
    const updateQueue: FunctionComponentUpdateQueue | null = ( finishedWork.updateQueue as any );
    const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

    if ( lastEffect !== null ) {
        const firstEffect = lastEffect.next;
        let effect = firstEffect;

        do {
            if ( ( effect.tag & flags ) === flags ) {
                if ( enableSchedulingProfiler ) {
                    if ( ( flags & HookFlags.Passive ) !== HookFlags.NoHookEffect ) {
                        markComponentPassiveEffectMountStarted( finishedWork );
                    } else if ( ( flags & HookFlags.Layout ) !== HookFlags.NoHookEffect ) {
                        markComponentLayoutEffectMountStarted( finishedWork );
                    }
                }

                // Mount
                const create = effect.create;

                if ( __DEV__ ) {
                    if ( ( flags & HookFlags.Insertion ) !== HookFlags.NoHookEffect ) {
                        setIsRunningInsertionEffect( true );
                    }
                }

                const inst = effect.inst;
                const destroy = create();
                inst.destroy = destroy;

                if ( __DEV__ ) {
                    if ( ( flags & HookFlags.Insertion ) !== HookFlags.NoHookEffect ) {
                        setIsRunningInsertionEffect( false );
                    }
                }

                if ( enableSchedulingProfiler ) {
                    if ( ( flags & HookFlags.Passive ) !== HookFlags.NoHookEffect ) {
                        markComponentPassiveEffectMountStopped();
                    } else if ( ( flags & HookFlags.Layout ) !== HookFlags.NoHookEffect ) {
                        markComponentLayoutEffectMountStopped();
                    }
                }

                if ( __DEV__ ) {
                    if ( destroy !== undefined && typeof destroy !== "function" ) {
                        let hookName;

                        if ( ( effect.tag & HookFlags.Layout ) !== FiberFlags.NoFlags ) {
                            hookName = "useLayoutEffect";
                        } else if ( ( effect.tag & HookFlags.Insertion ) !== FiberFlags.NoFlags ) {
                            hookName = "useInsertionEffect";
                        } else {
                            hookName = "useEffect";
                        }

                        let addendum;

                        if ( destroy === null ) {
                            addendum = " You returned null. If your effect does not require clean " + "up, return undefined (or nothing).";
                        } else if ( typeof ( destroy as any ).then === "function" ) {
                            addendum = "\n\nIt looks like you wrote " + hookName + "(async () => ...) or returned a Promise. " + "Instead, write the async function inside your effect " + "and call it immediately:\n\n" + hookName + "(() => {\n" + "  async function fetchData() {\n" + "    // You can await here\n" + "    const response = await MyAPI.getData(someId);\n" + "    // ...\n" + "  }\n" + "  fetchData();\n" + "}, [someId]); // Or [] if effect doesn't need props or state\n\n" + "Learn more about data fetching with Hooks: https://reactjs.org/link/hooks-data-fetching";
                        } else {
                            addendum = " You returned: " + destroy;
                        }

                        console.error( "%s must not return anything besides a function, " + "which is used for clean-up.%s", hookName, addendum );
                    }
                }
            }

            effect = effect.next;
        } while ( effect !== firstEffect );
    }
}
