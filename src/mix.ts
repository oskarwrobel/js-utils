/**
 * Copies enumerable properties from the classes given as 2nd+ parameters to the
 * prototype of first class.
 *
 * @param targetClass Class which prototype will be extended.
 * @param mixins List of classes from which to get properties.
 */
export default function mix( targetClass: any, ...mixins: any[] ): void {
	for ( const mixin of mixins ) {
		for ( const key of Object.getOwnPropertyNames( mixin.prototype ) ) {
			if ( key in targetClass.prototype ) {
				continue;
			}

			Object.defineProperty( targetClass.prototype, key, Object.getOwnPropertyDescriptor( mixin.prototype, key ) );
		}
	}
}
