export interface EmitterInterface extends Emitter {}
type Callback = ( ...args: any ) => void;

/**
 * Injects Events emitter API into its host.
 *
 * @mixin
 */
export default class Emitter implements EmitterInterface {
	/**
	 * Map of emitters with register callbacks that are subscribed by this instance.
	 * Used to recognize which callback was registered by this instance.
	 */
	private _subscribedEmitters: Map<EmitterInterface, Callback[]> = new Map();

	/**
	 * Map of events and all registered callbacks under this event.
	 */
	private _events: Map<string, Callback[]> = new Map();

	/**
	 * Registers a callback function to be executed when an event is fired.
	 *
	 * @param eventName Name of event.
	 * @param callback Function executed when event is fired.
	 */
	on( eventName: string, callback: Callback ): void {
		this.listenTo( this, eventName, callback );
	}

	/**
	 * Stops executing the callback on the given event.
	 *
	 * @param eventName Name of event.
	 * @param callback Function to stop being called.
	 */
	off( eventName: string, callback: Callback ): void {
		this.stopListening( this, eventName, callback );
	}

	/**
	 * Fires an event, executing all callbacks registered for it.
	 *
	 * @param eventName Name of event.
	 * @param args Additional arguments passed to the callback.
	 */
	fire( eventName: string, ...args: any[] ): void {
		if ( !this._events.has( eventName ) ) {
			return;
		}

		for ( const callback of this._events.get( eventName ) ) {
			callback( ...args );
		}
	}

	/**
	 * Registers a callback function to be executed when the given emitter fires an event.
	 *
	 * @param emitter Object that fires event.
	 * @param eventName Name of event.
	 * @param callback Function executed when event is fired.
	 */
	listenTo( emitter: EmitterInterface, eventName: string, callback: Callback ): void {
		if ( !this._subscribedEmitters.has( emitter ) ) {
			this._subscribedEmitters.set( emitter, [] );
		}

		if ( !emitter._events.has( eventName ) ) {
			emitter._events.set( eventName, [] );
		}

		const emitterCallbacks = this._subscribedEmitters.get( emitter );
		const eventCallbacks = emitter._events.get( eventName );

		emitterCallbacks.push( callback );
		eventCallbacks.push( callback );
	}

	/**
	 * Stops listening for events.
	 *
	 * @param emitter Emitter to stop listening to.
	 * @param eventName Name of event.
	 * @param callback Function to stop being called.
	 */
	stopListening( emitter?: EmitterInterface, eventName?: string, callback?: Callback ): void {
		if ( !this._subscribedEmitters.size || emitter && !this._subscribedEmitters.has( emitter ) ) {
			return;
		}

		if ( eventName && !emitter._events.has( eventName ) ) {
			return;
		}

		if ( !emitter ) {
			for ( const subscribedEmitter of Array.from( this._subscribedEmitters.keys() ) ) {
				this.stopListening( subscribedEmitter );
			}

			return;
		}

		if ( !eventName ) {
			for ( const eventName of Array.from( emitter._events.keys() ) ) {
				this.stopListening( emitter, eventName );
			}

			return;
		}

		if ( !callback ) {
			for ( const callback of Array.from( emitter._events.get( eventName ) ) ) {
				this.stopListening( emitter, eventName, callback );
			}

			return;
		}

		const emitterCallbacks = this._subscribedEmitters.get( emitter );
		const eventCallbacks = emitter._events.get( eventName );

		// Remove callbacks from lists where are registered.
		emitterCallbacks.splice( emitterCallbacks.indexOf( callback ), 1 );
		eventCallbacks.splice( eventCallbacks.indexOf( callback ), 1 );

		// Remove callback lists when are empty.
		if ( !emitterCallbacks.length ) {
			this._subscribedEmitters.delete( emitter );
		}

		if ( !eventCallbacks.length ) {
			emitter._events.delete( eventName );
		}
	}
}
