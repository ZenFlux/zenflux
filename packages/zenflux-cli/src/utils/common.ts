export type TForceEnumKeys<T> = { [P in keyof Required<T>]: boolean };

