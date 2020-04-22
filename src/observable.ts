import { default as emitterDecorator, EmitterInterface } from './emitter';

type ObservableTarget = ( ...args: any ) => void;
type ObservableSource = Array<ObservableInterface | string>;
type SourceDefinition = Map<ObservableInterface, Set<string>>;
type ObservablePropertyToTarget = Map<string, Set<ObservableTarget>>;
type BindingTypes = {
	to( ...args: ObservableSource ): void;
}

export interface ObservableInterface extends EmitterInterface {
	set( name: string, value?: any ): void;
	bind( targetCallback: ObservableTarget ): BindingTypes;
	unbind( targetCallback: ObservableTarget ): void;
}

/**
 * Observable decorator.
 *
 * Provides observable properties and data binding functionality.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function ObservableDecorator<T extends { new( ...args: any[] ): {} }>( constructor: T ) {
	return class extends emitterDecorator( constructor ) implements ObservableInterface {
		private _observables: Map<string, any>;
		private _targetToSourceDefinition: Map<ObservableTarget, SourceDefinition>;
		private _sourcePropertyToTarget: Map<ObservableInterface, ObservablePropertyToTarget>;

		/**
		 * Creates an observable property and sets the value of it.
		 *
		 * Object on which an observable property has changed fires an
		 * ( change:propertyName: string, newValue: any, oldValue: any ) event.
		 *
		 * observable.set( 'foo', 'bar' ); // Initializes observable.
		 * observable.foo = 'biz'; // Changes the value of already initialized observable.
		 *
		 * @param name The property name.
		 * @param value The property value.
		 */
		set( name: string, value?: any ): void {
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

			// At this point property name is unknown.
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			this[ name ] = value;
		}

		/**
		 * Binds callback to other objects that implements Observable interface.
		 *
		 * It is possible to bind callback to one or to multiple observables:
		 *
		 * observable.bind( a => ... ) ).to( otherObservable, 'a' );
		 * observable.bind( ( a, b ) => ... ) ).to( otherObservable, 'a', otherObservable, 'b' );
		 *
		 * @param targetCallback The callback that will be called when any of bound observables change.
		 */
		bind( targetCallback: ObservableTarget ): BindingTypes {
			if ( !this._targetToSourceDefinition && !this._sourcePropertyToTarget ) {
				this._targetToSourceDefinition = new Map();
				this._sourcePropertyToTarget = new Map();
			}

			if ( this._targetToSourceDefinition.has( targetCallback ) ) {
				throw new Error( 'Cannot bind the same callback twice.' );
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

		/**
		 * Removes the binding for given callback.
		 *
		 * @param targetCallback
		 */
		unbind( targetCallback: ObservableTarget ): void {
			if ( !this._targetToSourceDefinition || !this._targetToSourceDefinition.has( targetCallback ) ) {
				return;
			}

			this._targetToSourceDefinition.delete( targetCallback );

			for ( const [ observable, propertyToTarget ] of this._sourcePropertyToTarget ) {
				for ( const [ property, targets ] of propertyToTarget ) {
					if ( targets.has( targetCallback ) ) {
						targets.delete( targetCallback );

						if ( !targets.size ) {
							propertyToTarget.delete( property );
							this.stopListening( observable, 'change:' + property );

							if ( !propertyToTarget.size ) {
								this._sourcePropertyToTarget.delete( observable );
							}
						}
					}
				}
			}
		}
	};
}

function formatSource( properties: ObservableSource ): SourceDefinition {
	const definition = new Map();

	if ( properties.length < 2 ) {
		throw new Error( 'Invalid source definition.' );
	}

	for ( let i = 0; i < properties.length - 1; i += 2 ) {
		const source = properties[ i ];
		const property = properties[ i + 1 ];

		if ( typeof source === 'string' || typeof source.bind !== 'function' ) {
			throw new Error( 'Invalid source definition.' );
		}

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
			// At this point property name is unknown.
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			values.push( source[ property ] );
		}
	}

	return values;
}
