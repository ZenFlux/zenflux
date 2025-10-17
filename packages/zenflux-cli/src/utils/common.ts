/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
export type TForceEnumKeys<T> = { [P in keyof Required<T>]: boolean };

export function zUppercaseAt( str: string, at = 0 ): string {
    return str.charAt( at ).toUpperCase() + str.slice( at + 1 );
};
