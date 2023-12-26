import { unstable_scheduleCallback as Scheduler_scheduleCallback } from "@zenflux/react-scheduler";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

const { ReactCurrentActQueue } = ReactSharedInternals;

const fakeActCallbackNode = {};

export function fiberWorkScheduleCallback( priorityLevel: any, callback: any ) {
    if ( __DEV__ ) {
        // If we're currently inside an `act` scope, bypass Scheduler and push to
        // the `act` queue instead.
        const actQueue = ReactCurrentActQueue.current;

        if ( actQueue !== null ) {
            actQueue.push( callback );
            return fakeActCallbackNode;
        } else {
            return Scheduler_scheduleCallback( priorityLevel, callback );
        }
    } else {
        // In production, always call Scheduler. This function will be stripped out.
        return Scheduler_scheduleCallback( priorityLevel, callback );
    }
}
