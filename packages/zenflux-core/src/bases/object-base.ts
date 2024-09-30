/**
 * The `ObjectBase` class is a foundational class serves as the base for other classes in the system.
 * It is responsible for managing the name and unique identifier of derived classes.
 * This class provides the basic structure for classes that need to have a unique identifier
 * and a common way to retrieve their names.
 *
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { ForceMethodBase } from "@zenflux/core/src/errors/force-method-implementation";

export abstract class ObjectBase {
    private readonly _id: string;
    private readonly name: string = "__UNDEFINED_NAME__";

    /**
     * Initializes the name and unique identifier for the instance.
     */
    protected constructor() {
        // Initialize the name by calling the abstract method getName()
        this.name = this.getName();

        // Generate a unique identifier using a combination of timestamp and random numbers
        const timestamp = performance.now() * 1000000;
        const random1 = BigInt( Math.floor( Math.random() * 1000000 ) );
        const random2 = BigInt( Math.floor( Math.random() * 1000000 ) );

        this._id = `${ timestamp }${ random1 }${ random2 }`;
    }

    /**
     * Static method to retrieve the name of the class. This method is abstract and must be implemented
     * by derived classes.
     */
    public static getName(): string {
        throw new ForceMethodBase( "ObjectBase", "getName" );
    }

    /**
     * Retrieves the name of the current instance by calling the static `getName()` method of the
     * constructor (derived class).
     */
    public getName() {
        return ( this.constructor as typeof ObjectBase ).getName();
    }

    /**
     * Retrieves the unique identifier of the current instance.
     */
    public getUniqueId() {
        return this._id;
    }

    /**
     * Retrieves the initial name that was set during construction. This name may be "__UNDEFINED_NAME__"
     * if the `getName()` method of the derived class does not provide a valid name.
     */
    public getInitialName() {
        return this.name;
    }

    /**
     * Retrieves an array of hierarchical class names from the current instance up to the `ObjectBase` class.
     */
    public getHierarchyNames() {
        let classNames = [];
        let obj = Object.getPrototypeOf( this );
        let className: string;

        // Traverse the prototype chain and collect class names until the base ObjectBase class is reached.
        while ( ( className = obj.getName() ) !== "Object" ) {
            classNames.push( className );
            obj = Object.getPrototypeOf( obj );

            // Break the loop if the prototype's constructor is ObjectBase (reached the base class).
            if ( obj.constructor === ObjectBase ) {
                break;
            }
        }

        return classNames;
    }
}

