// TODO: Ideally these types would be opaque but that doesn't work well with
// our reconciler fork infra, since these leak into non-reconciler packages.
export type Lanes = number;
export type Lane = number;
export type LaneMap<T> = Array<T>;
