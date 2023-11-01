/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
export type TForceEnumKeys<T> = { [P in keyof Required<T>]: boolean };

