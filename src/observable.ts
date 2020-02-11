import Emitter from './emitter';
import mix from './mix';

interface Observable {
	[ key: string ]: any;
}

type ObservableTarget = ( ...args: any ) => void;
type ObservableSource = Array<Observable | string>;
type SourceDefinition = Map<Observable, Set<string>>;
type ObservablePropertyToTarget = Map<string, Set<ObservableTarget>>;

interface BindingTypes {
	to( ...args: ObservableSource ): void;
}

class Observable {
	private _observables: Map<string, any>;
	private _targetToSourceDefinition: Map<ObservableTarget, SourceDefinition>;
	private _sourcePropertyToTarget: Map<Observable, ObservablePropertyToTarget>;

	/**
	 * @param name
	 * @param value
	 */
	set( name: string, value: any ): void {
		if ( !this._observables ) {
			this._observables = new Map();
		}

		if ( !this._observables.has( name ) ) {
			Object.defineProperty( this, name, {
				enumerable: true,
				get(): any {
					return this._observables.get( name );
				},
				set( value: any ) {
					const oldValue = this._observables.get( name );

					if ( oldValue !== value ) {
						this._observables.set( name, value );
						this.fire( 'change:' + name, value, oldValue );
					}
				}
			} );
		}

		this[ name ] = value;
	}

	/**
	 * @param targetCallback
	 */
	bind( targetCallback: ObservableTarget ): BindingTypes {
		if ( !this._targetToSourceDefinition && !this._sourcePropertyToTarget ) {
			this._targetToSourceDefinition = new Map();
			this._sourcePropertyToTarget = new Map();
		}

		return {
			/**
			 * @param properties
			 */
			to: ( ...properties: ObservableSource ): void => {
				// Format source from:
				//
				// ObservableA, 'propertyA', ObservableA, 'propertyB', ObservableB, 'propertyA', ObservableB, 'propertyB';
				//
				// to:
				//
				// {
				//     ObservableA: [ 'propertyA', 'propertyB' ],
				//     ObservableB: [ 'propertyA', 'propertyB' ],
				// }
				const sourceDefinition: SourceDefinition = formatSource( properties );

				// Remember source definition for the target callback.
				this._targetToSourceDefinition.set( targetCallback, sourceDefinition );

				// Loop through properties to bind each of them with a callback.
				for ( const [ source, properties ] of sourceDefinition ) {
					// Remember which callback is bind to which property.
					// This will help to call all callbacks related to changed property.
					//
					// Callback and property relation is stored as:
					//
					// {
					//     ObservableA: {
					//         propertyA: [ callbackA, callbackB ],
					//         propertyB: [ callbackB, callbackC ],
					//     },
					//     ObservableB: {
					//         propertyA: [ callbackA, callbackB ],
					//         propertyB: [ callbackB, callbackC ],
					//     }
					// }
					if ( !this._sourcePropertyToTarget.has( source ) ) {
						this._sourcePropertyToTarget.set( source, new Map() );
					}

					const sourceProperties = this._sourcePropertyToTarget.get( source );

					for ( const property of properties ) {
						// Attach listener for property that has been not already bind.
						if ( !sourceProperties.has( property ) ) {
							sourceProperties.set( property, new Set() );

							this.listenTo( source, 'change:' + property, () => {
								for ( const target of sourceProperties.get( property ) ) {
									target( ...collectAllTargetValues( this._targetToSourceDefinition.get( target ) ) );
								}
							} );
						}

						// Store property -> callback relation.
						sourceProperties.get( property ).add( targetCallback );
					}
				}

				// Initial callback execution.
				targetCallback( ...collectAllTargetValues( this._targetToSourceDefinition.get( targetCallback ) ) );
			}
		};
	}
}

mix( Observable, Emitter );

export default Observable;

function formatSource( properties: ObservableSource ): SourceDefinition {
	const definition = new Map();

	for ( let i = 0; i < properties.length - 1; i += 2 ) {
		const source = properties[ i ];
		const property = properties[ i + 1 ];

		if ( typeof property !== 'string' ) {
			throw new Error( 'Invalid source definition.' );
		}

		if ( definition.has( source ) ) {
			definition.get( source ).add( property );
		} else {
			definition.set( source, new Set( [ property ] ) );
		}
	}

	return definition;
}

function collectAllTargetValues( sourceDefinition: SourceDefinition ): Array<any> {
	const values = [];

	for ( const [ source, properties ] of sourceDefinition ) {
		for ( const property of properties ) {
			values.push( source[ property ] );
		}
	}

	return values;
}
