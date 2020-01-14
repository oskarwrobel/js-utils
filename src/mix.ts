/**
 * Copies enumerable properties from the classe given as 2nd+ parameters to the
 * prototype of first object (a constructor).
 *
 * @param {Function} targetClass Class which prototype will be extended.
 * @param {Function} [...mixins] Objects from which to get properties.
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
